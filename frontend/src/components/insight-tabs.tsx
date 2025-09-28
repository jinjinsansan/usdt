"use client";

import { useMemo, useState } from "react";

import type { TraceNode, TraceResult } from "@/types/trace";

type InsightKey = "danger" | "caution" | "safe";

const tabMeta: Record<InsightKey, { label: string; badge: string; color: string }> = {
  danger: { label: "危険サイン", badge: "🔴", color: "border-rose-200 bg-rose-50 text-rose-700" },
  caution: { label: "注意ポイント", badge: "🟡", color: "border-amber-200 bg-amber-50 text-amber-700" },
  safe: { label: "安心材料", badge: "🟢", color: "border-emerald-200 bg-emerald-50 text-emerald-700" }
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
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">チェックポイント</h3>
        <div className="flex gap-2">
          {(Object.keys(tabMeta) as InsightKey[]).map((key) => {
            const meta = tabMeta[key];
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                <span className="mr-1" aria-hidden>{meta.badge}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-4 rounded-2xl border p-4 text-base" data-active={active}>
        <ul className={`space-y-2 ${tabMeta[active].color}`}>
          {insights[active].map((item) => (
            <li key={item} className="rounded-xl bg-white/60 px-4 py-2">
              <span className="mr-2" aria-hidden>
                {tabMeta[active].badge}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
