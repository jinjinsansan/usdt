import type { TraceMeta } from "@/types/trace";

import styles from "./result-status.module.css";

type ResultStatusProps = {
  meta: TraceMeta;
};

const formatDate = (value?: string | null) => {
  if (!value) return "－";
  try {
    return new Date(value).toLocaleString("ja-JP");
  } catch {
    return value ?? "－";
  }
};

const estimateDaysFromBlocks = (ranges: Array<{ from: number; to: number }>) => {
  if (!ranges.length) return "-";
  const blocks = Math.max(...ranges.map((r) => r.to - r.from));
  const seconds = blocks * 12; // approximate 12 sec per block
  const days = seconds / (60 * 60 * 24);
  if (days < 1) {
    return "過去数時間";
  }
  if (days < 7) {
    return `約${Math.round(days)}日分`;
  }
  return `約${Math.round(days / 7)}週間分`;
};

export const ResultStatus = ({ meta }: ResultStatusProps) => {
  const rangeDescription = estimateDaysFromBlocks(meta.searchedBlockRanges);

  return (
    <section className={`surface-card ${styles.statusCard}`}>
      <div className={styles.headline}>
        {meta.noTransfersFound ? "ℹ️ 取引は見つかりませんでした" : "📊 解析サマリー"}
      </div>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>解析した取引</span>
          <span className={styles.statValue}>{meta.transfersAnalyzed} 件</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>たどり着いた深さ</span>
          <span className={styles.statValue}>{meta.depthExplored} / 10 階層</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>検索した期間</span>
          <span className={styles.statValue}>{rangeDescription}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>最古の取引</span>
          <span className={styles.statValue}>{formatDate(meta.earliestTransferAt)}</span>
        </div>
        {!meta.noTransfersFound && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>最新の取引</span>
            <span className={styles.statValue}>{formatDate(meta.latestTransferAt)}</span>
          </div>
        )}
      </div>
      {meta.notes && (
        <div className={styles.notes}>
          {meta.notes.map((note) => (
            <p key={note} className={styles.noteItem}>
              <span aria-hidden>💡</span>
              {note}
            </p>
          ))}
        </div>
      )}
    </section>
  );
};
