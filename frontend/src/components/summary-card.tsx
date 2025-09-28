import type { TraceResult } from "@/types/trace";
import styles from "./summary-card.module.css";

const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;
const formatDate = (value?: string | null) => {
  if (!value) return "－";
  try {
    return new Date(value).toLocaleString("ja-JP");
  } catch {
    return value ?? "－";
  }
};

type SummaryCardProps = {
  result: TraceResult;
};

export const SummaryCard = ({ result }: SummaryCardProps) => {
  const { summary, meta } = result;

  return (
    <section className={styles.card}>
      <header className={styles.headline}>
        <p className="muted-text">結論</p>
        <h2>
          {meta.noTransfersFound ? (
            <>
              入力したウォレットに一致する送受信は見つかりませんでした
              <span className="accent-text">
                （調査の確信度: {formatConfidence(summary.finalDestinationConfidence)}）
              </span>
            </>
          ) : (
            <>
              この資金は最終的に
              <br />
              <strong>{summary.finalDestination}</strong> に到達しました
              <span className="accent-text">
                （確信度: {formatConfidence(summary.finalDestinationConfidence)}）
              </span>
            </>
          )}
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

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>解析した取引: {meta.transfersAnalyzed} 件</span>
        <span className={styles.metaItem}>追跡深度: {meta.depthExplored} / 10 階層</span>
        {meta.earliestTransferAt && (
          <span className={styles.metaItem}>最古: {formatDate(meta.earliestTransferAt)}</span>
        )}
        {meta.latestTransferAt && (
          <span className={styles.metaItem}>最新: {formatDate(meta.latestTransferAt)}</span>
        )}
      </div>
    </section>
  );
};
