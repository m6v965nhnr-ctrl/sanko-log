"use client";

import { useMemo, useState } from "react";
import { summarizeDailyRecord, UNIT_LABEL, UNIT_SUFFIX, type RecordUnit } from "@/lib/dailyRecord";
import type { StudyLog } from "@/lib/types";

// 「日々の記録」の、軽い棒グラフ(外部のグラフ部品は使わない。CSSの高さだけで出す)
function MiniBarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex h-24 items-end gap-1">
      {bars.map((b, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full min-h-[2px] rounded-t bg-sky-600"
            style={{ height: `${(b.value / max) * 100}%` }}
            title={`${b.label}: ${b.value}ページ`}
          />
          <span className="text-[9px] text-gray-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DailyRecordView({ logs }: { logs: StudyLog[] }) {
  const [unit, setUnit] = useState<RecordUnit>("day");
  const summary = useMemo(() => summarizeDailyRecord(logs, unit), [logs, unit]);

  if (logs.length === 0) return <p className="py-4 text-center text-[11px] text-gray-400">まだ記録がありません。</p>;

  return (
    <div className="space-y-2">
      <div role="tablist" aria-label="表示の単位" className="grid w-48 grid-cols-3 rounded-full border border-gray-200 p-1 text-[11px] font-medium">
        {(["day", "week", "month"] as const).map((u) => (
          <button
            key={u}
            role="tab"
            aria-selected={unit === u}
            onClick={() => setUnit(u)}
            className={`rounded-full py-1 transition ${unit === u ? "bg-gray-900 text-white" : "text-gray-500"}`}
          >
            {UNIT_LABEL[u]}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-600">
        記録した{UNIT_SUFFIX[unit]}の平均：<span className="font-semibold text-gray-900">{summary.avgPerBucket.toFixed(1)}ページ</span>
      </p>
      {summary.daysSinceLast !== null && summary.daysSinceLast >= 7 && (
        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">最後の記録から{summary.daysSinceLast}日たっています。</p>
      )}
      <MiniBarChart bars={summary.bars} />
    </div>
  );
}
