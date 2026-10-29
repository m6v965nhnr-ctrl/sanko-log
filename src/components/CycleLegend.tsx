import { CYCLE_COLORS, CYCLE_LABELS } from "@/lib/ui";

export function CycleLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-[9px] font-medium">
      {CYCLE_LABELS.map((label, i) => (
        <span key={label} className={`rounded px-1.5 py-0.5 ${CYCLE_COLORS[i]}`}>
          {label}
        </span>
      ))}
    </div>
  );
}
