import type { TraceResult } from "@/types/trace";
import styles from "./summary-card.module.css";

const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;

type SummaryCardProps = {
  result: TraceResult;
};

export const SummaryCard = ({ result }: SummaryCardProps) => {
  const { summary } = result;

  return (
    <section className={styles.card}>
      <header className={styles.headline}>
        <p className="muted-text">結論</p>
        <h2>
          この資金は最終的に
          <br />
          <strong>{summary.finalDestination}</strong> に到達しました
          <span className="accent-text">（確信度: {formatConfidence(summary.finalDestinationConfidence)}）</span>
        </h2>
      </header>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span role="img" aria-label="危険">
              🔴
            </span>
            怪しいアドレス経由
          </p>
          <p className={styles.kpiValue}>{summary.suspiciousHopCount} 回</p>
          <p className={styles.kpiMeta}>確信度: {formatConfidence(summary.suspiciousConfidence)}</p>
        </div>

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span role="img" aria-label="注意">
              🟡
            </span>
            資金分散レベル
          </p>
          <p className={styles.kpiValue}>{summary.fragmentationLevel} 箇所</p>
          <p className={styles.kpiMeta}>確信度: {formatConfidence(summary.fragmentationConfidence)}</p>
        </div>

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span role="img" aria-label="時間">
              🕑
            </span>
            解析日時
          </p>
          <p className={styles.kpiValue}>{new Date(result.generatedAt).toLocaleString("ja-JP")}</p>
          <p className={styles.kpiMeta}>リクエストID: {result.requestId}</p>
        </div>
      </div>
    </section>
  );
};
