import { describe, expect, it } from 'vitest';

import { traceService } from './trace.service.js';

describe('traceService', () => {
  it('returns mock trace data', async () => {
    const result = await traceService.buildTrace({ address: 'TDummyAddress123' });

    expect(result.rootAddress).toBe('TDummyAddress123');
    expect(result.nodes).toHaveLength(4);
    expect(result.summary.finalDestination).toContain('Binance');
  });
});
