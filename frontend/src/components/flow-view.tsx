import type { TraceNode } from "@/types/trace";
import styles from "./flow-view.module.css";

const riskLabels = {
  high: "高リスク",
  medium: "注意",
  low: "安全そう",
  unknown: "判定中"
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
    <section className={styles.container}>
      <h3 className={styles.title}>家系図ビュー</h3>
      <div className={styles.list}>
        {nodes.map((node) => {
          const depthOffset = node.depth * 24;
          return (
            <div
              key={node.id}
              style={{ marginLeft: `${depthOffset}px` }}
              className={`${styles.node} ${node.depth === 0 ? styles.root : ""}`}
            >
              <div className={styles.header}>
                <p className={styles.address}>{node.addressLabel ?? node.address}</p>
                <span className={styles.chainBadge}>{node.chain}</span>
                <span
                  className={`${styles.riskBadge} ${
                    node.riskLevel === "high"
                      ? styles.riskHigh
                      : node.riskLevel === "medium"
                        ? styles.riskMedium
                        : node.riskLevel === "low"
                          ? styles.riskLow
                          : styles.riskUnknown
                  }`}
                >
                  {node.riskLevel === "high" ? "🔴" : node.riskLevel === "medium" ? "🟡" : node.riskLevel === "low" ? "🟢" : "⚪"}
                  {riskLabels[node.riskLevel]}
                </span>
              </div>
              <dl className={styles.details}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>送金額:</dt>
                  <dd>{formatAmount(node.usdtAmount, node.usdRate)}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>日時:</dt>
                  <dd>{formatTimestamp(node.timestamp)}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>手数料:</dt>
                  <dd>
                    {node.fee.toLocaleString()} {node.chain === "TRON" ? "TRX" : "ガス"}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>トランザクション:</dt>
                  <dd>
                    <a
                      href={`${explorerBase[node.chain]}${node.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.link}
                    >
                      {node.txHash.substring(0, 12)}...
                    </a>
                  </dd>
                </div>
              </dl>
              {node.riskFactors.length > 0 && (
                <ul className={styles.riskFactors}>
                  {node.riskFactors.map((factor) => (
                    <li key={factor} className={styles.riskFactor}>
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
