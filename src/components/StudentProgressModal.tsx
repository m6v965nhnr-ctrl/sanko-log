"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProgressBar } from "@/components/ProgressBar";
import { CycleLegend } from "@/components/CycleLegend";
import { DailyRecordView } from "@/components/DailyRecordView";
import { OUTLINE_BUTTON_CLASS, understandingLabel } from "@/lib/ui";
import type { RosterEntry } from "@/lib/classes";

export function StudentProgressModal({ entry, onClose }: { entry: RosterEntry; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"progress" | "daily">("progress");
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const understandingValues = entry.books.flatMap((b) => b.logs.map((l) => l.understanding).filter((u): u is number => u !== null));
  const avgUnderstanding =
    understandingValues.length > 0 ? understandingValues.reduce((a, b) => a + b, 0) / understandingValues.length : null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-900">{entry.student.display_name ?? "（名前未設定）"}さんの参考書の進み具合</h2>
          <button onClick={onClose} className={OUTLINE_BUTTON_CLASS}>
            閉じる
          </button>
        </div>

        <div role="tablist" aria-label="表示の種類" className="mt-3 grid grid-cols-2 rounded-full border border-gray-200 p-1 text-xs font-medium">
          {(["progress", "daily"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full py-1.5 transition ${tab === t ? "bg-gray-900 text-white" : "text-gray-500"}`}
            >
              {t === "progress" ? "進み具合" : "日々の記録"}
            </button>
          ))}
        </div>

        {tab === "daily" ? (
          entry.books.length === 0 ? (
            <p className="mt-4 text-xs text-gray-400">まだ参考書がありません。</p>
          ) : (
            <ul className="mt-4 space-y-5">
              {entry.books.map((b) => (
                <li key={b.id}>
                  <p className="text-xs font-semibold text-gray-800">{b.title}</p>
                  <div className="mt-1">
                    <DailyRecordView logs={b.logs} />
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <div className="mt-3">
              <CycleLegend />
            </div>

            {avgUnderstanding !== null && (
              <div className="mt-3 rounded-xl bg-gray-900 px-3 py-2.5 text-white">
                <p className="text-[11px] text-white/70">理解度（自己評価の平均）</p>
                <p className="text-sm font-bold">
                  {avgUnderstanding.toFixed(1)} <span className="ml-1 text-xs font-normal text-white/80">{understandingLabel(avgUnderstanding)}</span>
                </p>
              </div>
            )}

            {entry.books.length === 0 ? (
              <p className="mt-4 text-xs text-gray-400">まだ参考書がありません。</p>
            ) : (
              <ul className="mt-4 space-y-5">
                {entry.books.map((b) => (
                  <li key={b.id}>
                    <p className="text-xs font-semibold text-gray-800">{b.title}</p>
                    <div className="mt-1">
                      <ProgressBar bucketCounts={b.bucketCounts} total={b.total_pages ?? 0} />
                    </div>

                    {b.logs.length === 0 ? (
                      <p className="mt-2 text-[10px] text-gray-400">まだ記録がありません。</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-gray-100">
                        {b.logs.map((log) => (
                          <li key={log.id} className="py-1 text-[10px] text-gray-500">
                            {log.studied_on} ・ p.{log.page_start}-{log.page_end}
                            {log.understanding !== null && ` ・ 理解度 ${log.understanding}（${understandingLabel(log.understanding)}）`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
