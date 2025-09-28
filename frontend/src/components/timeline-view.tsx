import type { TraceNode } from "@/types/trace";

type TimelineViewProps = {
  nodes: TraceNode[];
};

const bubbleColors = {
  high: "bg-rose-100 border-rose-200",
  medium: "bg-amber-100 border-amber-200",
  low: "bg-emerald-100 border-emerald-200",
  unknown: "bg-slate-100 border-slate-200"
} as const;

export const TimelineView = ({ nodes }: TimelineViewProps) => {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <h3 className="mb-4 text-xl font-bold">時系列ビュー</h3>
      <div className="space-y-4">
        {nodes.map((node, index) => {
          const isMe = index % 2 === 0;
          return (
            <div key={node.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-3xl border px-4 py-3 text-base shadow ${bubbleColors[node.riskLevel]}`}
              >
                <p className="text-sm text-slate-600">{new Date(node.timestamp).toLocaleString("ja-JP")}</p>
                <p className="text-lg font-semibold">{node.addressLabel ?? node.address}</p>
                <p className="mt-1 text-sm">{node.chain} / {node.txHash.substring(0, 8)}...</p>
                <p className="mt-2 text-base font-bold">{node.usdtAmount.toLocaleString()} USDT</p>
                {node.riskFactors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {node.riskFactors.map((factor) => (
                      <li key={factor}>⚠️ {factor}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
