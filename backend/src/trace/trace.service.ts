import { fetchEthereumTrace } from './ethereum.trace.js';
import { buildMockTrace } from './trace.mock.js';
import { enrichTraceWithSummary } from './trace.risk.js';
import { TraceRequestInput, TraceResult, TraceMeta, TraceNode } from './trace.types.js';

const recentSearches = new Map<string, TraceResult>();

const buildEmptyTrace = (
  address: string,
  chain: 'ETHEREUM' | 'TRON' | 'BSC' | 'POLYGON' | 'ANY' = 'ANY',
  balances?: TraceResult['balances'],
): TraceResult => {
  const root: TraceNode = {
    id: `root-${address}`,
    depth: 0,
    address,
    chain: chain === 'ANY' ? 'ETHEREUM' : chain,
    txHash: 'root',
    timestamp: new Date().toISOString(),
    usdtAmount: 0,
    usdRate: 1,
    fee: 0,
    riskLevel: 'unknown',
    riskFactors: [],
  };

  const meta: TraceMeta = {
    transfersAnalyzed: 0,
    depthExplored: 0,
    earliestTransferAt: null,
    latestTransferAt: null,
    searchedBlockRanges: [],
    noTransfersFound: true,
    notes: ['直近の探索範囲ではUSDTの送受信が見つかりませんでした。'],
  };

  return {
    requestId: `empty-${address}-${Date.now()}`,
    rootAddress: address,
    chainHint: chain === 'ANY' ? undefined : chain,
    generatedAt: new Date().toISOString(),
    summary: {
      finalDestination: address,
      finalDestinationConfidence: 0.25,
      suspiciousHopCount: 0,
      suspiciousConfidence: 0.1,
      fragmentationLevel: 0,
      fragmentationConfidence: 0.1,
    },
    nodes: [root],
    meta,
    balances:
      balances ?? {
        usdt: { amount: 0, raw: '0', symbol: 'USDT' },
        native: {
          amount: 0,
          raw: '0',
          symbol:
            chain === 'ETHEREUM'
              ? 'ETH'
              : chain === 'TRON'
                ? 'TRX'
                : chain === 'BSC'
                  ? 'BNB'
                  : chain === 'POLYGON'
                    ? 'MATIC'
                    : 'ETH',
        },
      },
  };
};

export const traceService = {
  async buildTrace(input: TraceRequestInput): Promise<TraceResult> {
    const key = `${input.chain ?? 'ANY'}:${input.address}`;
    const cached = recentSearches.get(key);
    if (cached) {
      return cached;
    }

    let result: TraceResult | null = null;
    let balancesOverride: TraceResult['balances'] | undefined;

    if (input.chain === 'ETHEREUM' || (!input.chain && input.address.startsWith('0x'))) {
      result = await fetchEthereumTrace(input).catch((error: unknown) => {
        if (error && typeof error === 'object' && 'balances' in error) {
          const maybeBalances = (error as { balances?: TraceResult['balances'] }).balances;
          if (maybeBalances) {
            balancesOverride = maybeBalances;
          }
        }
        // eslint-disable-next-line no-console
        console.error('Ethereum trace failed, returning empty result', error);
        return null;
      });
    }

    if (!result) {
      if (input.chain === 'ETHEREUM' || (!input.chain && input.address.startsWith('0x'))) {
        result = enrichTraceWithSummary(buildEmptyTrace(input.address, 'ETHEREUM', balancesOverride));
      } else {
        result = enrichTraceWithSummary(buildMockTrace(input.address));
      }
    }

    recentSearches.set(key, result);
    if (recentSearches.size > 50) {
      const firstKey = recentSearches.keys().next().value;
      if (firstKey) {
        recentSearches.delete(firstKey);
      }
    }
    return result;
  },

  async getRecentHistory(): Promise<TraceResult[]> {
    return Array.from(recentSearches.values()).slice(-10).reverse();
  },
};
