import type { StudyLog } from "@/lib/types";

// 「日々の記録」: 1件の記録が何ページぶんか(終了p - 開始p + 1)を、日・週・月ごとに積み上げる

export type RecordUnit = "day" | "week" | "month";
export const UNIT_LABEL: Record<RecordUnit, string> = { day: "日ごと", week: "週ごと", month: "月ごと" };
export const UNIT_SUFFIX: Record<RecordUnit, string> = { day: "日", week: "週", month: "月" };

function pagesOf(l: StudyLog): number {
  return l.page_end - l.page_start + 1;
}
// 週は月曜はじまり(studied_onは "YYYY-MM-DD" の日付文字列)
function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
function monthOf(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}
function bucketKeyOf(studiedOn: string, unit: RecordUnit): string {
  if (unit === "day") return studiedOn;
  if (unit === "week") return mondayOf(studiedOn);
  return monthOf(studiedOn);
}
function bucketLabel(key: string, unit: RecordUnit): string {
  const [, m, d] = key.split("-");
  return unit === "month" ? `${Number(m)}月` : `${Number(m)}/${Number(d)}`;
}

export type DailyRecordSummary = {
  bars: { label: string; value: number }[]; // 直近14本ぶん
  avgPerBucket: number;
  daysSinceLast: number | null;
};

export function summarizeDailyRecord(logs: StudyLog[], unit: RecordUnit): DailyRecordSummary {
  const map = new Map<string, number>();
  for (const l of logs) {
    const key = bucketKeyOf(l.studied_on, unit);
    map.set(key, (map.get(key) ?? 0) + pagesOf(l));
  }
  const bars = Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-14)
    .map(([key, value]) => ({ label: bucketLabel(key, unit), value }));
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
  const avgPerBucket = map.size > 0 ? total / map.size : 0;
  const lastStudiedOn = logs.reduce<string | null>((latest, l) => (!latest || l.studied_on > latest ? l.studied_on : latest), null);
  const daysSinceLast = lastStudiedOn
    ? Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(lastStudiedOn)) / 86400000)
    : null;
  return { bars, avgPerBucket, daysSinceLast };
}
