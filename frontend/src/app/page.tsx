"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AddressForm } from "@/components/address-form";
import { FlowView } from "@/components/flow-view";
import { FooterNav } from "@/components/footer-nav";
import { HelpButton } from "@/components/help-button";
import { InsightTabs } from "@/components/insight-tabs";
import { SummaryCard } from "@/components/summary-card";
import { TimelineView } from "@/components/timeline-view";
import { fetchHistory, fetchTrace } from "@/lib/api";
import type { SupportedChain, TraceRequest, TraceResult } from "@/types/trace";

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
      <main className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
        <section id="top" className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-lg font-semibold text-sky-600">USDT追跡くん</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">
            会員登録なしで<br />だれでもUSDTの行き先を一瞬でチェック
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            ウォレットアドレスを入れるだけ。最大10階層の資金の流れと危険サインを、わかりやすい色と絵文字で表示します。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleHeroCTA}
              className="rounded-full bg-sky-500 px-8 py-4 text-xl font-bold text-white shadow-xl transition hover:bg-sky-600"
            >
              今すぐ調べる
            </button>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              🔐 会員登録不要・無料で使えます
            </span>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft" aria-label="チェーン別クイックメニュー">
          <h2 className="text-2xl font-bold text-slate-900">チェーン別かんたんメニュー</h2>
          <p className="mt-1 text-sm text-slate-600">よく使うチェーンをタップすると見本アドレスが自動入力されます</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {quickOptions.map((option) => (
              <button
                key={option.chain}
                type="button"
                onClick={() => handleQuickSelect(option)}
                className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-left transition hover:border-sky-300 hover:bg-sky-100"
              >
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    <span className="mr-2 text-2xl" aria-hidden>{option.emoji}</span>
                    {option.label}
                  </p>
                  <p className="text-sm text-slate-600">{option.description}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-600">タップで入力</span>
              </button>
            ))}
          </div>
        </section>

        <section id="howto" className="rounded-3xl bg-white p-6 shadow-soft" aria-label="使い方">
          <h2 className="text-2xl font-bold text-slate-900">使い方は3ステップ</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {howToSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-semibold text-sky-600">STEP {index + 1}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section ref={formSectionRef} id="history" className="scroll-mt-24">
          <AddressForm
            history={history}
            loading={loading}
            prefillAddress={prefillAddress}
            prefillChain={prefillChain}
            onSubmit={handleSubmit}
          />
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <section className="flex flex-col gap-4">
            <SummaryCard result={result} />
            <InsightTabs result={result} />

            <div className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-slate-600">表示モード</p>
                <h3 className="text-xl font-bold text-slate-900">
                  {viewMode === "flow" ? "家系図ビュー" : "時系列ビュー"}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-base font-semibold transition ${viewMode === "flow" ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-700"}`}
                  onClick={() => setViewMode("flow")}
                >
                  家系図風
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-base font-semibold transition ${viewMode === "timeline" ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-700"}`}
                  onClick={() => setViewMode("timeline")}
                >
                  LINE風
                </button>
              </div>
            </div>

            {viewMode === "flow" ? <FlowView nodes={result.nodes} /> : <TimelineView nodes={result.nodes} />}
          </section>
        )}

        <section id="help" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-slate-900">サポート</h2>
          <p className="mt-2 text-slate-600">ご不明な点は公式LINEまたはメールでサポートいたします。FAQも順次掲載予定です。</p>
          {hasHistory && (
            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              最近調べたアドレス: {latestHistoryText}
            </p>
          )}
        </section>
      </main>

      <FooterNav />
      <HelpButton />
    </>
  );
}
