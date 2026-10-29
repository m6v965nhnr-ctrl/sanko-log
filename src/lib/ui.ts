// リライトの「参考書進捗」機能と、同じ色・形にそろえる

// 周回(記録)回数の色のものさし。タップ式のページ表と、進捗バーの両方で使う
export const CYCLE_COLORS = [
  "bg-gray-100 text-gray-500", // 0回
  "bg-emerald-100 text-emerald-700", // 1回
  "bg-teal-500 text-white", // 2回
  "bg-blue-500 text-white", // 3回
  "bg-indigo-500 text-white", // 4回
  "bg-purple-600 text-white", // 5回以上
];

export const CYCLE_BAR_COLORS = ["bg-emerald-400", "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-600"];

export const CYCLE_LABELS = ["0回", "1回", "2回", "3回", "4回", "5回+"];

export function cycleColorClass(count: number): string {
  return CYCLE_COLORS[Math.min(count, CYCLE_COLORS.length - 1)];
}

export const PRIMARY_BUTTON_CLASS = "rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
export const OUTLINE_BUTTON_CLASS = "rounded-full border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700";
export const CARD_CLASS = "rounded-2xl bg-white p-4 shadow-sm";
export const PAGE_CLASS = "min-h-screen bg-[#fafafa] pb-28";
export const HEADER_CLASS = "border-b border-gray-100 bg-white px-6 py-5";
export const CONTENT_CLASS = "mx-auto max-w-2xl space-y-3 px-6 py-5";

// 0〜10の理解度を、ことばに変える
export function understandingLabel(v: number): string {
  if (v < 2.5) return "理解してない";
  if (v < 4.5) return "少し";
  if (v < 5.5) return "半分";
  if (v < 7) return "まあまあ";
  if (v < 9.5) return "それなりに";
  return "完璧";
}

export function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
