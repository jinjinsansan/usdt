export type SupportedChain = 'TRON' | 'ETHEREUM' | 'BSC' | 'POLYGON';

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface TraceSummary {
  finalDestination: string;
  finalDestinationLabel?: string;
  finalDestinationConfidence: number;
  suspiciousHopCount: number;
  suspiciousConfidence: number;
  fragmentationLevel: number;
  fragmentationConfidence: number;
}

export interface TraceNode {
  id: string;
  parentId?: string;
  depth: number;
  address: string;
  addressLabel?: string;
  chain: SupportedChain;
  txHash: string;
  timestamp: string;
  usdtAmount: number;
  usdRate: number;
  fee: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
}

export interface TraceMeta {
  transfersAnalyzed: number;
  depthExplored: number;
  earliestTransferAt?: string | null;
  latestTransferAt?: string | null;
  searchedBlockRanges: Array<{ from: number; to: number }>;
  noTransfersFound: boolean;
  notes?: string[];
}

export interface TraceResult {
  requestId: string;
  rootAddress: string;
  chainHint?: SupportedChain;
  generatedAt: string;
  summary: TraceSummary;
  nodes: TraceNode[];
  meta: TraceMeta;
}

export interface TraceRequest {
  address: string;
  chain?: SupportedChain;
  depth?: number;
}
