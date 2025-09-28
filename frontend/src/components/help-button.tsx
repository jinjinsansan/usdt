"use client";

import { useState } from "react";

import styles from "./help-button.module.css";

export const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.tooltip}>
          <p className={styles.tooltipTitle}>お困りですか？</p>
          <p>
            よくある質問や用語解説はこちら。
            <a href="#help" className="accent-text">
              サポートを見る
            </a>
          </p>
        </div>
      )}
      <button type="button" onClick={() => setOpen((prev) => !prev)} className={styles.button}>
        ❓
        <span>{open ? "閉じる" : "困ったらタップ"}</span>
      </button>
    </div>
  );
};
