"use client";

import { useEffect, useMemo, useState } from "react";

import type { SupportedChain, TraceRequest } from "@/types/trace";

const chainLabels: Record<SupportedChain, string> = {
  TRON: "TRON (TRC-20)",
  ETHEREUM: "Ethereum (ERC-20)",
  BSC: "Binance Smart Chain (BEP-20)",
  POLYGON: "Polygon (MATIC)"
};

const detectChain = (address: string): SupportedChain | undefined => {
  if (address.startsWith("T") && address.length >= 30) {
    return "TRON";
  }
  if (address.startsWith("0x")) {
    return "ETHEREUM";
  }
  return undefined;
};

type AddressFormProps = {
  defaultAddress?: string;
  loading?: boolean;
  history?: string[];
  prefillAddress?: string;
  prefillChain?: SupportedChain;
  onSubmit: (payload: TraceRequest) => void;
};

export const AddressForm = ({
  loading = false,
  defaultAddress = "",
  history = [],
  prefillAddress,
  prefillChain,
  onSubmit
}: AddressFormProps) => {
  const [address, setAddress] = useState(defaultAddress);
  const [chain, setChain] = useState<SupportedChain | "auto">("auto");
  const [depth, setDepth] = useState(5);

  useEffect(() => {
    if (prefillAddress) {
      setAddress(prefillAddress);
    }
  }, [prefillAddress]);

  useEffect(() => {
    if (prefillChain) {
      setChain(prefillChain);
    }
  }, [prefillChain]);

  const autoDetectedChain = useMemo(() => detectChain(address), [address]);
  const resolvedChain = chain === "auto" ? autoDetectedChain : chain;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.trim()) {
      return;
    }

    onSubmit({
      address: address.trim(),
      chain: resolvedChain,
      depth
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl bg-white/80 p-4 shadow-soft backdrop-blur"
      aria-label="ウォレットアドレス検索フォーム"
    >
      <div className="grid gap-2">
        <label htmlFor="address" className="text-lg font-semibold">
          調べたいウォレットアドレス
        </label>
        <input
          id="address"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="例: TXXXXXXXXXXXXXXXXXXXXXXXX"
          className="rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-sky-500 focus:outline-none focus:ring"
          inputMode="text"
          autoComplete="off"
          required
        />
        {autoDetectedChain && chain === "auto" && (
          <p className="text-sm text-sky-700">自動判定: {chainLabels[autoDetectedChain]}</p>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-lg font-semibold">対応チェーン</span>
          <select
            value={chain}
            onChange={(event) => setChain(event.target.value as SupportedChain | "auto")}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-sky-500 focus:outline-none focus:ring"
          >
            <option value="auto">自動判定</option>
            {Object.entries(chainLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-lg font-semibold">追跡する階層 (最大10)</span>
          <input
            type="range"
            min={1}
            max={10}
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            className="w-full"
          />
          <span className="text-center text-base font-medium">{depth} 階層まで追跡</span>
        </label>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl bg-slate-100 p-3 text-sm">
          <p className="mb-2 font-semibold">最近調べたアドレス</p>
          <div className="flex flex-wrap gap-2">
            {history.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAddress(item)}
                className="rounded-full bg-white px-3 py-1 shadow-sm transition hover:bg-sky-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-lg font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring"
        disabled={loading}
      >
        {loading ? "調査中..." : "このアドレスを追跡"}
      </button>
    </form>
  );
};
