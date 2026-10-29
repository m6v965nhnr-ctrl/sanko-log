import { CYCLE_BAR_COLORS } from "@/lib/ui";

// 周回数ごとの色で、積み上げの進捗バーを出す(リライトの参考書進捗と同じ見せ方)
export function ProgressBar({ bucketCounts, total }: { bucketCounts: number[]; total: number }) {
  const done = bucketCounts.reduce((a, b) => a + b, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
        {bucketCounts.map(
          (n, i) =>
            n > 0 && (
              <div key={i} className={CYCLE_BAR_COLORS[i]} style={{ width: `${total > 0 ? (n / total) * 100 : 0}%` }} />
            )
        )}
      </div>
      <p className="text-[10px] text-gray-400">
        {done}/{total}ページ（{pct}%）
      </p>
    </div>
  );
}
