import { Contract, formatUnits } from 'ethers';
import type { EventLog } from 'ethers';

import { enrichTraceWithSummary } from './trace.risk.js';
import type { TraceBalances, TraceMeta, TraceNode, TraceRequestInput, TraceResult } from './trace.types.js';
import { erc20Abi } from '../abi/erc20.js';
import { ethereumProvider } from '../clients/ethereum.js';

const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;

const MAX_DEPTH = 10;
const MAX_EVENTS_PER_HOP = 15;
const MAX_QUEUE = 500;
const DEFAULT_DEPTH = 5;
const BLOCK_WINDOWS = [
  50_000, // ~1 week
  250_000, // ~1 month
  1_000_000, // ~4 months
  2_500_000, // ~1 year
  5_000_000, // ~2 years
  10_000_000, // ~4 years
];
const MAX_BLOCK_LOOKUP = 15_000_000; // safety cap (~6 years)
const MAX_LOGS_PER_WINDOW = 800;

const toUsdtAmount = (rawValue: bigint) => Number(formatUnits(rawValue, USDT_DECIMALS));

const getLogId = (log: EventLog) => {
  const index = 'logIndex' in log ? Number(log.logIndex) : ('index' in log ? Number(log.index) : 0);
  return `${log.transactionHash}-${index}`;
};

const buildNodeFromLog = async (
  log: EventLog,
  depth: number,
  parentId: string,
  isOutgoing: boolean,
  rootAddress: string,
): Promise<TraceNode> => {
  if (!ethereumProvider) {
    throw new Error('Ethereum provider is not configured');
  }

  const receipt = await ethereumProvider.getTransaction(log.transactionHash);
  const block = await ethereumProvider.getBlock(log.blockNumber);
  const logIndex = 'logIndex' in log ? Number(log.logIndex) : 0;
  const id = `${log.transactionHash}-${logIndex}`;
  const derivedAddress = isOutgoing ? (log.args?.to ?? '0x0') : (log.args?.from ?? '0x0');
  const addressLabel = derivedAddress.toLowerCase() === rootAddress.toLowerCase() ? '入力したウォレット' : undefined;

  return {
    id,
    parentId,
    depth,
    address: derivedAddress,
    addressLabel,
    chain: 'ETHEREUM',
    txHash: log.transactionHash,
    timestamp: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
    usdtAmount: log.args?.value ? toUsdtAmount(log.args.value) : 0,
    usdRate: 1,
    fee: receipt?.maxFeePerGas ? Number(formatUnits(receipt.maxFeePerGas, 'gwei')) : 0,
    riskLevel: 'unknown',
    riskFactors: [],
  };
};

export const fetchEthereumTrace = async (input: TraceRequestInput): Promise<TraceResult | null> => {
  if (!ethereumProvider) {
    return null;
  }

  const address = input.address;
  const contract = new Contract(USDT_CONTRACT_ADDRESS, erc20Abi, ethereumProvider);
  const latestBlock = await ethereumProvider.getBlockNumber();
  const maxDepth = Math.min(input.depth ?? DEFAULT_DEPTH, MAX_DEPTH);

  let balances: TraceBalances = {
    usdt: { amount: 0, raw: '0', symbol: 'USDT' },
    native: { amount: 0, raw: '0', symbol: 'ETH' },
  };

  try {
    const [usdtRaw, nativeRaw] = await Promise.all([
      contract.balanceOf(address).catch(() => BigInt(0)),
      ethereumProvider.getBalance(address).catch(() => BigInt(0)),
    ]);

    balances = {
      usdt: {
        amount: Number(formatUnits(usdtRaw, USDT_DECIMALS)),
        raw: usdtRaw.toString(),
        symbol: 'USDT',
      },
      native: {
        amount: Number(formatUnits(nativeRaw, 18)),
        raw: nativeRaw.toString(),
        symbol: 'ETH',
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to fetch balances', error);
  }

  const rootNode: TraceNode = {
    id: `root-${address}`,
    depth: 0,
    address,
    chain: 'ETHEREUM',
    txHash: 'root',
    timestamp: new Date().toISOString(),
    usdtAmount: 0,
    usdRate: 1,
    fee: 0,
    riskLevel: 'unknown',
    riskFactors: [],
  };

  const queue: Array<{ address: string; depth: number; nodeId: string }> = [
    { address, depth: 0, nodeId: rootNode.id },
  ];
  const nodes: TraceNode[] = [];
  const visited = new Set<string>();
  const exploredBlocks = new Map<string, number>();
  const blockRanges: Array<{ from: number; to: number }> = [];
  const notes: string[] = [];
  let truncatedQueue = false;
  let truncatedLogs = false;

  nodes.push(rootNode);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= maxDepth) {
      continue;
    }
    if (visited.has(`${current.address}-${current.depth}`)) {
      continue;
    }
    visited.add(`${current.address}-${current.depth}`);

    const outgoingFilter = contract.filters.Transfer(current.address);
    const incomingFilter = contract.filters.Transfer(null, current.address);
    let allLogs: EventLog[] = [];

    for (const window of BLOCK_WINDOWS) {
      if (allLogs.length >= MAX_LOGS_PER_WINDOW) {
        break;
      }
      const latestSeen = exploredBlocks.get(`${current.address}-${current.depth}`) ?? latestBlock;
      const fromBlock = Math.max(0, latestSeen - window);
      if (latestSeen - fromBlock <= 0) {
        continue;
      }

      const [outgoingLogsRaw, incomingLogsRaw] = await Promise.all([
        contract.queryFilter(outgoingFilter, fromBlock, latestSeen),
        contract.queryFilter(incomingFilter, fromBlock, latestSeen),
      ]);

      const outgoingLogs = outgoingLogsRaw as EventLog[];
      const incomingLogs = incomingLogsRaw as EventLog[];
      const combined = [...outgoingLogs, ...incomingLogs]
        .sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0))
        .slice(0, MAX_EVENTS_PER_HOP);

      allLogs = [...allLogs, ...combined];
      exploredBlocks.set(`${current.address}-${current.depth}`, fromBlock);
      blockRanges.push({ from: fromBlock, to: latestSeen });

      if (fromBlock === 0 || latestBlock - fromBlock >= MAX_BLOCK_LOOKUP) {
        break;
      }
      if (combined.length >= MAX_EVENTS_PER_HOP) {
        truncatedLogs = true;
        break;
      }
    }

    const seenLogIds = new Set<string>();
    const uniqueLogs = allLogs
      .sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0))
      .filter((log) => {
        const id = getLogId(log);
        if (seenLogIds.has(id)) {
          return false;
        }
        seenLogIds.add(id);
        return true;
      })
      .slice(0, MAX_LOGS_PER_WINDOW);
    if (uniqueLogs.length >= MAX_LOGS_PER_WINDOW) {
      truncatedLogs = true;
    }

    for (const log of uniqueLogs) {
      const isOutgoing = log.args?.from?.toLowerCase() === current.address.toLowerCase();
      const node = await buildNodeFromLog(log, current.depth + 1, current.nodeId, isOutgoing, address);
      nodes.push(node);
      const nextAddress = isOutgoing ? log.args?.to : log.args?.from;
      if (nextAddress) {
        if (queue.length < MAX_QUEUE) {
          queue.push({ address: nextAddress, depth: current.depth + 1, nodeId: node.id });
        } else if (!truncatedQueue) {
          truncatedQueue = true;
        }
      }
    }
  }

  const transferNodes = nodes.filter((node) => node.depth > 0);
  const depthExplored = transferNodes.reduce((max, node) => Math.max(max, node.depth), 0);
  const earliestTransferAt = transferNodes.length
    ? transferNodes.reduce((earliest, node) =>
        new Date(node.timestamp) < new Date(earliest ?? node.timestamp) ? node.timestamp : earliest,
      transferNodes[0].timestamp)
    : null;
  const latestTransferAt = transferNodes.length
    ? transferNodes.reduce((latest, node) =>
        new Date(node.timestamp) > new Date(latest ?? node.timestamp) ? node.timestamp : latest,
      transferNodes[0].timestamp)
    : null;

  if (truncatedLogs) {
    notes.push('多くの取引が存在するため、最新の一部のみを表示しています。');
  }
  if (truncatedQueue) {
    notes.push('分岐が多いため、途中で追跡を終了しました。詳しくは追加調査をご検討ください。');
  }

  if (transferNodes.length === 0) {
    notes.push('直近の検索範囲でUSDTの送受信は見つかりませんでした。');
  }

  const uniqueBlockRanges = blockRanges.length
    ? Array.from(new Map(blockRanges.map((range) => [`${range.from}-${range.to}`, range])).values())
    : [{ from: Math.max(0, latestBlock - BLOCK_WINDOWS[0]), to: latestBlock }];

  const meta: TraceMeta = {
    transfersAnalyzed: transferNodes.length,
    depthExplored,
    earliestTransferAt,
    latestTransferAt,
    searchedBlockRanges: uniqueBlockRanges,
    noTransfersFound: transferNodes.length === 0,
    notes: notes.length > 0 ? Array.from(new Set(notes)) : undefined,
    balances,
  };

  return enrichTraceWithSummary({
    requestId: `eth-${address}-${Date.now()}`,
    rootAddress: address,
    chainHint: 'ETHEREUM',
    generatedAt: new Date().toISOString(),
    summary: {
      finalDestination: nodes.at(-1)?.address ?? '不明',
      finalDestinationConfidence: 0.5,
      suspiciousHopCount: 0,
      suspiciousConfidence: 0.2,
      fragmentationLevel: 0,
      fragmentationConfidence: 0.2,
    },
    nodes,
    meta,
    balances,
  });
};
