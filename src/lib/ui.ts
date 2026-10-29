// リライトの「参考書進捗」機能と、同じ色・形にそろえる(実際の画面を確認して合わせた)

// 周回(記録)回数の色のものさし。タップ式のページ表と、進捗バーの両方で使う
export const CYCLE_COLORS = [
  "bg-gray-100 text-gray-500", // 0回(未記録)
  "bg-emerald-100 text-emerald-700", // 1周
  "bg-teal-500 text-white", // 2周
  "bg-blue-500 text-white", // 3周
  "bg-indigo-500 text-white", // 4周
  "bg-purple-600 text-white", // 5周以上
];

export const CYCLE_BAR_COLORS = ["bg-emerald-400", "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-600"];

// 凡例は「1周」から(0回・未記録は凡例に出さない)
export const CYCLE_LABELS = ["1周", "2周", "3周", "4周", "5周+"];

export function cycleColorClass(count: number): string {
  return CYCLE_COLORS[Math.min(count, CYCLE_COLORS.length - 1)];
}

export const PRIMARY_BUTTON_CLASS = "rounded-full bg-black py-2.5 text-sm font-medium text-white disabled:opacity-40";
export const OUTLINE_BUTTON_CLASS = "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700";
export const CARD_CLASS = "rounded-2xl bg-white p-4 shadow-sm";
export const PAGE_CLASS = "min-h-screen bg-[#f4f8f8] pb-28";
export const HEADER_CLASS = "border-b border-gray-100 bg-white px-6 py-5";
export const CONTENT_CLASS = "mx-auto max-w-2xl space-y-3 px-6 py-5";

// 理解度スライダー(リライトと同じ、紺のトラック・緑のつまみ)
export const RANGE_SLIDER_CLASS =
  "mt-2 h-4 w-full cursor-pointer appearance-none bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-blue-950 " +
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-blue-950 " +
  "[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-emerald-500";

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
