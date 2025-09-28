import type { TraceResult } from "@/types/trace";

const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;

type SummaryCardProps = {
  result: TraceResult;
};

export const SummaryCard = ({ result }: SummaryCardProps) => {
  const { summary } = result;

  return (
    <section className="grid gap-4 rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-6 text-white shadow-xl">
      <header>
        <p className="text-sm uppercase tracking-wide">結論</p>
        <h2 className="text-2xl font-black">
          このお金は最終的に
          <br />
          <span className="text-3xl">{summary.finalDestination}</span> に行きました
          （確信度: {formatConfidence(summary.finalDestinationConfidence)}）
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/20 p-4">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <span role="img" aria-label="危険">🔴</span>
            怪しいアドレス
          </p>
          <p className="text-2xl font-bold">{summary.suspiciousHopCount} 回</p>
          <p className="text-sm">確信度: {formatConfidence(summary.suspiciousConfidence)}</p>
        </div>

        <div className="rounded-2xl bg-white/20 p-4">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <span role="img" aria-label="注意">🟡</span>
            資金分散
          </p>
          <p className="text-2xl font-bold">{summary.fragmentationLevel} 分岐</p>
          <p className="text-sm">確信度: {formatConfidence(summary.fragmentationConfidence)}</p>
        </div>

        <div className="rounded-2xl bg-white/20 p-4">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <span role="img" aria-label="時間">🕑</span>
            解析日時
          </p>
          <p className="text-2xl font-bold">{new Date(result.generatedAt).toLocaleString("ja-JP")}</p>
          <p className="text-sm">リクエストID: {result.requestId}</p>
        </div>
      </div>
    </section>
  );
};
