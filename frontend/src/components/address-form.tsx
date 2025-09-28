"use client";

import { useEffect, useMemo, useState } from "react";

import type { SupportedChain, TraceRequest } from "@/types/trace";
import styles from "./address-form.module.css";

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
    <form onSubmit={handleSubmit} className={styles.form} aria-label="ウォレットアドレス検索フォーム">
      <div className={styles.fieldGroup}>
        <label htmlFor="address" className={styles.label}>
          調べたいウォレットアドレス
        </label>
        <input
          id="address"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="例: TXXXXXXXXXXXXXXXXXXXXXXXX"
          inputMode="text"
          autoComplete="off"
          required
        />
        {autoDetectedChain && chain === "auto" && (
          <p className={styles.helper}>自動判定: {chainLabels[autoDetectedChain]}</p>
        )}
      </div>

      <div className={styles.gridRow}>
        <label className={styles.fieldGroup}>
          <span className={styles.label}>対応チェーン</span>
          <select
            value={chain}
            onChange={(event) => setChain(event.target.value as SupportedChain | "auto")}
          >
            <option value="auto">自動判定</option>
            {Object.entries(chainLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldGroup}>
          <span className={styles.label}>追跡する階層 (最大10)</span>
          <input
            type="range"
            min={1}
            max={10}
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
          />
          <span className={styles.sliderInfo}>{depth} 階層まで追跡</span>
        </label>
      </div>

      {history.length > 0 && (
        <div className={styles.historyBox}>
          <p className={styles.historyLabel}>最近調べたアドレス</p>
          <div className={styles.historyChips}>
            {history.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAddress(item)}
                className={styles.historyChip}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className={`btn-primary ${styles.submit}`}
        disabled={loading}
      >
        {loading ? "調査中..." : "このアドレスを追跡"}
      </button>
    </form>
  );
};
