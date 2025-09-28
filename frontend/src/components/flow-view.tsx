import type { TraceNode } from "@/types/trace";

const riskColors = {
  high: "bg-red-100 text-red-700 border-red-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-green-100 text-green-700 border-green-300",
  unknown: "bg-gray-100 text-gray-700 border-gray-300"
} as const;

const riskLabels = {
  high: "🔴 高リスク",
  medium: "🟡 注意",
  low: "🟢 安全そう",
  unknown: "⚪ 判定中"
} as const;

type FlowViewProps = {
  nodes: TraceNode[];
};

const formatAmount = (usdt: number, rate: number) => {
  const jpy = usdt * rate * 160;
  return `${usdt.toLocaleString()} USDT / 約 ${Math.round(jpy).toLocaleString()} 円`;
};

const formatTimestamp = (value: string) => new Date(value).toLocaleString("ja-JP");

const explorerBase: Record<TraceNode['chain'], string> = {
  TRON: 'https://tronscan.org/#/transaction/',
  ETHEREUM: 'https://etherscan.io/tx/',
  BSC: 'https://bscscan.com/tx/',
  POLYGON: 'https://polygonscan.com/tx/',
};

export const FlowView = ({ nodes }: FlowViewProps) => {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <h3 className="mb-4 text-xl font-bold">家系図ビュー</h3>
      <div className="space-y-4">
        {nodes.map((node) => {
          const depthOffset = node.depth * 24;
          return (
            <div
              key={node.id}
              style={{ marginLeft: `${depthOffset}px` }}
              className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              {node.parentId && (
                <span className="absolute -left-6 top-5 h-0.5 w-6 bg-slate-300" aria-hidden />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold">
                  {node.addressLabel ?? node.address}
                </p>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                  {node.chain}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${riskColors[node.riskLevel]}`}
                >
                  {riskLabels[node.riskLevel]}
                </span>
              </div>
              <dl className="mt-2 grid gap-1 text-sm">
                <div className="flex flex-wrap gap-2">
                  <dt className="font-semibold">送金額:</dt>
                  <dd>{formatAmount(node.usdtAmount, node.usdRate)}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="font-semibold">日時:</dt>
                  <dd>{formatTimestamp(node.timestamp)}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="font-semibold">手数料:</dt>
                  <dd>{node.fee.toLocaleString()} {node.chain === "TRON" ? "TRX" : "ガス"}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="font-semibold">トランザクション:</dt>
                  <dd>
                    <a
                      href={`${explorerBase[node.chain]}${node.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 underline"
                    >
                      {node.txHash.substring(0, 12)}...
                    </a>
                  </dd>
                </div>
              </dl>
              {node.riskFactors.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {node.riskFactors.map((factor) => (
                    <li key={factor} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      {factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
