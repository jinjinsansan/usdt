import { fetchEthereumTrace } from './ethereum.trace.js';
import { buildMockTrace } from './trace.mock.js';
import { enrichTraceWithSummary } from './trace.risk.js';
import { TraceRequestInput, TraceResult } from './trace.types.js';

const recentSearches = new Map<string, TraceResult>();

export const traceService = {
  async buildTrace(input: TraceRequestInput): Promise<TraceResult> {
    const key = `${input.chain ?? 'ANY'}:${input.address}`;
    const cached = recentSearches.get(key);
    if (cached) {
      return cached;
    }

    let result: TraceResult | null = null;

    if ((input.chain === 'ETHEREUM' || (!input.chain && input.address.startsWith('0x')))) {
      result = await fetchEthereumTrace(input).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Ethereum trace failed, falling back to mock', error);
        return null;
      });
    }

    if (!result) {
      result = enrichTraceWithSummary(buildMockTrace(input.address));
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
