import { TraceNode, TraceResult, TraceSummary } from './trace.types.js';

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

export const buildSummary = (nodes: TraceNode[]): TraceSummary => {
  const destinationNode = nodes.at(-1);
  const averageRisk = calculateAverageRisk(nodes);
  const suspiciousHops = calculateSuspiciousHops(nodes);
  const fragmentation = calculateFragmentation(nodes);

  return {
    finalDestination: destinationNode?.addressLabel ?? destinationNode?.address ?? '不明',
    finalDestinationLabel: destinationNode?.addressLabel,
    finalDestinationConfidence: destinationNode?.riskLevel === 'low' ? 0.92 : 0.65,
    suspiciousHopCount: suspiciousHops,
    suspiciousConfidence: suspiciousHops > 0 ? Math.min(0.5 + averageRisk / 200, 0.95) : 0.2,
    fragmentationLevel: fragmentation,
    fragmentationConfidence: fragmentation > 5 ? 0.75 : 0.4,
  };
};

export const enrichTraceWithSummary = (trace: TraceResult): TraceResult => ({
  ...trace,
  summary: buildSummary(trace.nodes),
});
