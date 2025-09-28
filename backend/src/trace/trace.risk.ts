import { TraceMeta, TraceNode, TraceResult, TraceSummary } from './trace.types.js';

const riskWeight: Record<TraceNode['riskLevel'], number> = {
  high: 90,
  medium: 60,
  low: 20,
  unknown: 40,
};

const calculateAverageRisk = (nodes: TraceNode[]): number => {
  if (nodes.length === 0) {
    return 0;
  }

  const scoreSum = nodes.reduce((sum, node) => sum + riskWeight[node.riskLevel], 0);
  return scoreSum / nodes.length;
};

const calculateSuspiciousHops = (nodes: TraceNode[]): number => {
  return nodes.filter((node) => node.riskLevel === 'high').length;
};

const calculateFragmentation = (nodes: TraceNode[]): number => {
  const uniqueDepths = new Set(nodes.map((node) => node.depth));
  const forkCount = uniqueDepths.size > 0 ? nodes.length - uniqueDepths.size : 0;
  return Math.max(forkCount, 0);
};

export const buildSummary = (nodes: TraceNode[], meta: TraceMeta): TraceSummary => {
  const transferNodes = nodes.filter((node) => node.depth > 0);
  const destinationNode = transferNodes.at(-1) ?? nodes.at(-1);
  const averageRisk = calculateAverageRisk(transferNodes);
  const suspiciousHops = calculateSuspiciousHops(transferNodes);
  const fragmentation = calculateFragmentation(transferNodes);

  const finalConfidence = meta.noTransfersFound
    ? 0.25
    : destinationNode?.riskLevel === 'low'
      ? 0.92
      : 0.65;

  const suspiciousConfidence = suspiciousHops > 0 ? Math.min(0.5 + averageRisk / 200, 0.95) : meta.noTransfersFound ? 0.1 : 0.2;
  const fragmentationConfidence = fragmentation > 5 ? 0.75 : meta.noTransfersFound ? 0.15 : 0.4;

  return {
    finalDestination: destinationNode?.addressLabel ?? destinationNode?.address ?? '不明',
    finalDestinationLabel: destinationNode?.addressLabel,
    finalDestinationConfidence: finalConfidence,
    suspiciousHopCount: suspiciousHops,
    suspiciousConfidence: suspiciousConfidence,
    fragmentationLevel: fragmentation,
    fragmentationConfidence: fragmentationConfidence,
  };
};

export const enrichTraceWithSummary = (trace: TraceResult): TraceResult => ({
  ...trace,
  summary: buildSummary(trace.nodes, trace.meta),
  meta: {
    ...trace.meta,
  },
});
