"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProgressBar } from "@/components/ProgressBar";
import { CycleLegend } from "@/components/CycleLegend";
import { OUTLINE_BUTTON_CLASS, understandingLabel } from "@/lib/ui";
import type { RosterEntry } from "@/lib/classes";

export function StudentProgressModal({ entry, onClose }: { entry: RosterEntry; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

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

        <div className="mt-3">
          <CycleLegend />
        </div>

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
                        p.{log.page_start}〜{log.page_end} ・ {log.studied_on}
                        {log.understanding !== null && ` ・ 理解度 ${log.understanding}（${understandingLabel(log.understanding)}）`}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
