"use client";

import { useState } from "react";

export const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {open && (
        <div className="mb-3 max-w-xs rounded-2xl bg-white p-4 text-sm shadow-soft">
          <p className="font-semibold text-slate-800">お困りですか？</p>
          <p className="mt-1 text-slate-600">
            よくある質問や用語解説はこちら。
            <a href="#help" className="text-sky-600 underline ml-1">サポートを見る</a>
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-sky-600 focus:outline-none focus:ring"
      >
        ❓
        <span>{open ? "閉じる" : "困ったらタップ"}</span>
      </button>
    </div>
  );
};
