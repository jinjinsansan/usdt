import type { TraceNode } from "@/types/trace";
import styles from "./timeline-view.module.css";

type TimelineViewProps = {
  nodes: TraceNode[];
};

export const TimelineView = ({ nodes }: TimelineViewProps) => {
  const displayNodes = nodes.filter((node) => node.depth > 0);

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>時系列ビュー</h3>
      <div className={styles.timeline}>
        {displayNodes.map((node, index) => {
          const isMe = index % 2 === 0;
          return (
            <div key={node.id} className={`${styles.row} ${isMe ? styles.rowEnd : styles.rowStart}`}>
              <div
                className={`${styles.bubble} ${
                  node.riskLevel === "high"
                    ? styles.bubbleDanger
                    : node.riskLevel === "medium"
                      ? styles.bubbleCaution
                      : node.riskLevel === "low"
                        ? styles.bubbleSafe
                        : ""
                }`}
              >
                <p className={styles.timestamp}>{new Date(node.timestamp).toLocaleString("ja-JP")}</p>
                <p className={styles.address}>{node.addressLabel ?? node.address}</p>
                <p className={styles.meta}>
                  {node.chain} / {node.txHash.substring(0, 10)}...
                </p>
                <p className={styles.amount}>{node.usdtAmount.toLocaleString()} USDT</p>
                {node.riskFactors.length > 0 && (
                  <ul className={styles.factorList}>
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
