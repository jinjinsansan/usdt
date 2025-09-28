"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AddressForm } from "@/components/address-form";
import { FlowView } from "@/components/flow-view";
import { FooterNav } from "@/components/footer-nav";
import { HelpButton } from "@/components/help-button";
import { InsightTabs } from "@/components/insight-tabs";
import { SummaryCard } from "@/components/summary-card";
import { TimelineView } from "@/components/timeline-view";
import { ResultStatus } from "@/components/result-status";
import { fetchHistory, fetchTrace } from "@/lib/api";
import type { SupportedChain, TraceRequest, TraceResult } from "@/types/trace";
import styles from "./page.module.css";

type ViewMode = "flow" | "timeline";

const quickOptions: Array<{ chain: SupportedChain; label: string; description: string; sample: string; emoji: string }> = [
  { chain: "TRON", label: "TRONをチェック", description: "送金速度の速さが特徴", sample: "TQkExampleAddress123456789", emoji: "⚡" },
  { chain: "ETHEREUM", label: "Ethereumを追跡", description: "NFTやDeFiの取引に", sample: "0x1234exampleEthereumAddress", emoji: "🛡" },
  { chain: "BSC", label: "BSCの動きを見る", description: "高頻度送金の確認に", sample: "0xBscSampleAddress987654321", emoji: "🚀" },
  { chain: "POLYGON", label: "Polygonを確認", description: "少額の分散送金もキャッチ", sample: "0xPolygonAddressExample321", emoji: "🧩" }
];

const howToSteps = [
  { title: "アドレスを入力", detail: "コピーして貼り付けるだけでOK" },
  { title: "怪しい動きを確認", detail: "赤い表示が出たら要注意" },
  { title: "結果を保存", detail: "履歴からいつでも再チェック" }
];

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("flow");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [prefillChain, setPrefillChain] = useState<SupportedChain | undefined>();

  const formSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory()
      .then((items) => {
        setHistory(items.map((item) => item.rootAddress));
      })
      .catch(() => {
        // historyは任意のため無視
      });
  }, []);

  const handleSubmit = async (payload: TraceRequest) => {
    setLoading(true);
    setError(null);
    try {
      const trace = await fetchTrace(payload);
      setResult(trace);
      setHistory((prev) => {
        const deduped = [trace.rootAddress, ...prev.filter((item) => item !== trace.rootAddress)];
        return deduped.slice(0, 5);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "解析に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroCTA = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickSelect = (option: (typeof quickOptions)[number]) => {
    setPrefillAddress(option.sample);
    setPrefillChain(option.chain);
    formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hasHistory = history.length > 0;
  const latestHistoryText = useMemo(() => history.join(" / "), [history]);

  return (
    <>
      <main className={styles.container}>
        <section id="top" className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>USDT TRACKER</span>
            <h1 className={styles.heroTitle}>
              会員登録なしで、USDTの資金フローを<br />バイナンス級のダッシュボードで可視化
            </h1>
            <p className={styles.heroSubtitle}>
              ウォレットアドレスを入力するだけで、最大10階層の送金履歴・危険度・最終着地点を一度にチェック。
              暗号資産に不慣れな方でも直感的に判断できます。
            </p>
            <div className={styles.heroActions}>
              <button type="button" className="btn-primary" onClick={handleHeroCTA}>
                今すぐ追跡をはじめる
              </button>
              <span className={styles.accentInfo}>🔐 ログイン不要・無料で利用できます</span>
            </div>
          </div>
        </section>

        <section className={`${styles.quickMenu} surface-card`} aria-label="チェーン別クイックメニュー">
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>チェーン別クイックスタート</h2>
            <span className="muted-text">タップするとアドレスが自動入力されます</span>
          </div>
          <div className={styles.quickGrid}>
            {quickOptions.map((option) => (
              <button
                key={option.chain}
                type="button"
                onClick={() => handleQuickSelect(option)}
                className={styles.quickCard}
              >
                <span className={styles.quickLabel}>
                  <span aria-hidden>{option.emoji}</span>
                  {option.label}
                </span>
                <p className={styles.quickDescription}>{option.description}</p>
                <span className="chip">サンプルを入力</span>
              </button>
            ))}
          </div>
        </section>

        <section id="howto" className={`surface-card ${styles.stepsGrid}`} aria-label="使い方">
          {howToSteps.map((step, index) => (
            <div key={step.title} className={styles.stepCard}>
              <span className={styles.stepNumber}>STEP {index + 1}</span>
              <h3>{step.title}</h3>
              <p className="muted-text">{step.detail}</p>
            </div>
          ))}
        </section>

        <section ref={formSectionRef} id="history" className={`${styles.formSection} surface-card`}>
          <AddressForm
            history={history}
            loading={loading}
            prefillAddress={prefillAddress}
            prefillChain={prefillChain}
            onSubmit={handleSubmit}
          />
        </section>

        {error && <div className="surface-card danger-text">⚠️ {error}</div>}

        {result && (
          <section className={styles.resultsWrapper}>
            <ResultStatus meta={result.meta} />
            <SummaryCard result={result} />
            <InsightTabs result={result} />
            {result.meta.transfersAnalyzed > 0 ? (
              <>
                <div className={styles.modeSwitcher}>
                  <div>
                    <p className="muted-text">表示モード</p>
                    <h3>{viewMode === "flow" ? "家系図ビュー" : "時系列ビュー"}</h3>
                  </div>
                  <div className={styles.modeButtons}>
                    <button
                      type="button"
                      className={`${styles.modeButton} ${viewMode === "flow" ? styles.modeButtonActive : ""}`}
                      onClick={() => setViewMode("flow")}
                    >
                      家系図風
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeButton} ${viewMode === "timeline" ? styles.modeButtonActive : ""}`}
                      onClick={() => setViewMode("timeline")}
                    >
                      LINE風
                    </button>
                  </div>
                </div>

                {viewMode === "flow" ? <FlowView nodes={result.nodes} /> : <TimelineView nodes={result.nodes} />}
              </>
            ) : (
              <div className="surface-card">
                <p className="muted-text">
                  現状の検索範囲ではUSDTの送受信が見つかりませんでした。取引の有無をもう一度ご確認いただくか、
                  別チェーンや別の期間での調査をお試しください。
                </p>
              </div>
            )}
          </section>
        )}

        <section id="help" className={styles.supportSection}>
          <div>
            <h2 className={styles.sectionTitle}>サポート</h2>
            <p className="muted-text">
              公式LINEまたはメールで24時間以内にご返信します。詐欺相談や追跡代行もお気軽にお問い合わせください。
            </p>
          </div>
          {hasHistory && (
            <p className={styles.historyHighlight}>最近調べたアドレス: {latestHistoryText}</p>
          )}
          <div className={styles.supportFooter}>
            <span>📘 FAQを準備中</span>
            <span>🤝 パートナー企業募集中</span>
          </div>
        </section>
      </main>

      <FooterNav />
      <HelpButton />
    </>
  );
}
