import { Contract, formatUnits } from 'ethers';
import type { EventLog } from 'ethers';

import { enrichTraceWithSummary } from './trace.risk.js';
import type { TraceNode, TraceRequestInput, TraceResult } from './trace.types.js';
import { erc20Abi } from '../abi/erc20.js';
import { ethereumProvider } from '../clients/ethereum.js';

const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;

const MAX_DEPTH = 10;
const MAX_EVENTS_PER_HOP = 15;
const BLOCK_SEARCH_WINDOW = 50_000; // about ~1 week of blocks
const MAX_QUEUE = 200;

const toUsdtAmount = (rawValue: bigint) => Number(formatUnits(rawValue, USDT_DECIMALS));

const buildNodeFromLog = async (
  log: EventLog,
  depth: number,
  parentId: string,
  isOutgoing: boolean,
): Promise<TraceNode> => {
  if (!ethereumProvider) {
    throw new Error('Ethereum provider is not configured');
  }

  const receipt = await ethereumProvider.getTransaction(log.transactionHash);
  const block = await ethereumProvider.getBlock(log.blockNumber);
  const logIndex = 'logIndex' in log ? Number(log.logIndex) : 0;
  const id = `${log.transactionHash}-${logIndex}`;

  return {
    id,
    parentId,
    depth,
    address: isOutgoing ? (log.args?.to ?? '0x0') : (log.args?.from ?? '0x0'),
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
  const fromBlock = Math.max(0, latestBlock - BLOCK_SEARCH_WINDOW);

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

  nodes.push(rootNode);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= (input.depth ?? MAX_DEPTH)) {
      continue;
    }
    if (visited.has(`${current.address}-${current.depth}`)) {
      continue;
    }
    visited.add(`${current.address}-${current.depth}`);

    const outgoingFilter = contract.filters.Transfer(current.address);
    const incomingFilter = contract.filters.Transfer(null, current.address);

    const [outgoingLogsRaw, incomingLogsRaw] = await Promise.all([
      contract.queryFilter(outgoingFilter, fromBlock, latestBlock),
      contract.queryFilter(incomingFilter, fromBlock, latestBlock),
    ]);

    const outgoingLogs = outgoingLogsRaw as EventLog[];
    const incomingLogs = incomingLogsRaw as EventLog[];

    const sortedOutgoing = outgoingLogs
      .sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0))
      .slice(0, MAX_EVENTS_PER_HOP);
    const sortedIncoming = incomingLogs
      .sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0))
      .slice(0, MAX_EVENTS_PER_HOP);

    for (const log of sortedOutgoing) {
      const node = await buildNodeFromLog(log, current.depth + 1, current.nodeId, true);
      nodes.push(node);
      if (queue.length < MAX_QUEUE) {
        queue.push({ address: log.args?.to ?? current.address, depth: current.depth + 1, nodeId: node.id });
      }
    }

    for (const log of sortedIncoming) {
      const node = await buildNodeFromLog(log, current.depth + 1, current.nodeId, false);
      nodes.push(node);
      if (queue.length < MAX_QUEUE) {
        queue.push({ address: log.args?.from ?? current.address, depth: current.depth + 1, nodeId: node.id });
      }
    }
  }

  if (nodes.length === 0) {
    return null;
  }

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
  });
};
