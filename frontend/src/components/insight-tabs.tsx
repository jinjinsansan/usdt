"use client";

import { useMemo, useState } from "react";

import type { TraceNode, TraceResult } from "@/types/trace";
import styles from "./insight-tabs.module.css";

type InsightKey = "danger" | "caution" | "safe";

const tabMeta: Record<InsightKey, { label: string; badge: string; listClass: string }> = {
  danger: { label: "危険サイン", badge: "🔴", listClass: styles.listItemDanger },
  caution: { label: "注意ポイント", badge: "🟡", listClass: styles.listItemCaution },
  safe: { label: "安心材料", badge: "🟢", listClass: styles.listItemSafe }
};

const buildInsights = (result: TraceResult) => {
  const highRiskNodes = result.nodes.filter((node) => node.riskLevel === "high");
  const mediumRisk = result.nodes.filter((node) => node.riskLevel === "medium");
  const lowRisk = result.nodes.filter((node) => node.riskLevel === "low");

  const listFromNodes = (nodes: TraceNode[]) => {
    const factors = new Set<string>();
    nodes.forEach((node) => node.riskFactors.forEach((factor) => factors.add(factor)));
    return Array.from(factors);
  };

  const dangerItems = [
    ...(result.summary.suspiciousHopCount > 0
      ? [`怪しいアドレスを${result.summary.suspiciousHopCount} 回経由しています`] : []),
    ...(result.summary.fragmentationLevel > 8 ? ["資金が細かく分散され追跡が困難です"] : []),
    ...listFromNodes(highRiskNodes)
  ];

  const cautionItems = [
    ...(result.summary.fragmentationLevel > 0
      ? [`資金が${result.summary.fragmentationLevel} 経路に分岐しています`] : []),
    ...listFromNodes(mediumRisk)
  ];

  const safeItems = [
    ...(lowRisk.length > 0 ? ["既知の安全なアドレスを経由しています"] : []),
    ...(result.summary.finalDestinationConfidence > 0.8
      ? [
          `最終地点「${result.summary.finalDestination}」の確信度は${Math.round(result.summary.finalDestinationConfidence * 100)}%です`
        ]
      : [])
  ];

  return {
    danger: dangerItems.length > 0 ? dangerItems : ["危険サインは検知されていません"],
    caution: cautionItems.length > 0 ? cautionItems : ["特筆すべき注意点はありません"],
    safe: safeItems.length > 0 ? safeItems : ["データ量が少なく安心材料はまだありません"]
  } satisfies Record<InsightKey, string[]>;
};

type InsightTabsProps = {
  result: TraceResult;
};

export const InsightTabs = ({ result }: InsightTabsProps) => {
  const [active, setActive] = useState<InsightKey>("danger");

  const insights = useMemo(() => buildInsights(result), [result]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3>チェックポイント</h3>
        <div className={styles.tabs}>
          {(Object.keys(tabMeta) as InsightKey[]).map((key) => {
            const meta = tabMeta[key];
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
              >
                <span aria-hidden>{meta.badge}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className={styles.listWrapper} data-active={active}>
        <ul className={styles.list}>
          {insights[active].map((item) => (
            <li key={item} className={`${styles.listItem} ${tabMeta[active].listClass}`}>
              <span aria-hidden>{tabMeta[active].badge}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
