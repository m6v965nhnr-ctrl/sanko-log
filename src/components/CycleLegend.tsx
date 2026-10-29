import { CYCLE_COLORS, CYCLE_LABELS } from "@/lib/ui";

// 凡例は「1周」から(0回・未記録の色は出さない)。CYCLE_COLORSの0番は0回用なので、1つずらす
export function CycleLegend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {CYCLE_LABELS.map((label, i) => (
        <span key={label} className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${CYCLE_COLORS[i + 1]}`}>
          {label}
        </span>
      ))}
    </div>
  );
}
