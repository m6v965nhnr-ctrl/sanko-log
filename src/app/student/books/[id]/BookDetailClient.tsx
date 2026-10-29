"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { addStudyLog, countByPageFromLogs, deleteStudyLog, getBook, listStudyLogs, toPageRanges, updateStudyLog } from "@/lib/books";
import {
  CARD_CLASS,
  CONTENT_CLASS,
  cycleColorClass,
  HEADER_CLASS,
  OUTLINE_BUTTON_CLASS,
  PAGE_CLASS,
  PRIMARY_BUTTON_CLASS,
  RANGE_SLIDER_CLASS,
  todayStr,
  understandingLabel,
} from "@/lib/ui";
import { CycleLegend } from "@/components/CycleLegend";
import type { Book, StudyLog } from "@/lib/types";

export default function BookDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("student");
  const router = useRouter();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [jumpTo, setJumpTo] = useState("");
  const [studiedOn, setStudiedOn] = useState(todayStr());
  const [understanding, setUnderstanding] = useState(5);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFrom, setEditFrom] = useState("");
  const [editTo, setEditTo] = useState("");
  const [editDate, setEditDate] = useState("");

  const load = async () => {
    if (!profile) return;
    const b = await getBook(id);
    if (!b) {
      setBook(null);
      return;
    }
    setBook(b);
    setLogs(await listStudyLogs(b.id, profile.id));
  };

  useEffect(() => {
    if (!profile) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, id]);

  const counts = useMemo(() => countByPageFromLogs(logs), [logs]);
  const pagesRead = counts.size;

  function onTogglePage(p: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function onAddRange(e: React.FormEvent) {
    e.preventDefault();
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!from || !to || from > to) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (let p = from; p <= to; p++) next.add(p);
      return next;
    });
    setRangeFrom("");
    setRangeTo("");
  }

  function onJump(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(jumpTo);
    if (!p) return;
    const el = document.querySelector(`[data-page="${p}"]`);
    el?.scrollIntoView({ block: "center" });
  }

  async function onSave() {
    if (!book || !profile || selected.size === 0) return;
    setSaving(true);
    try {
      const ranges = toPageRanges([...selected]);
      for (const [from, to] of ranges) {
        await addStudyLog(book.id, profile.id, from, to, studiedOn, understanding);
      }
      setSelected(new Set());
      await load();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(log: StudyLog) {
    setEditingId(log.id);
    setEditFrom(String(log.page_start));
    setEditTo(String(log.page_end));
    setEditDate(log.studied_on);
  }

  async function saveEdit() {
    if (!editingId) return;
    const from = Number(editFrom);
    const to = Number(editTo);
    if (!from || !to || from > to || !editDate) return;
    await updateStudyLog(editingId, from, to, editDate);
    setEditingId(null);
    await load();
  }

  async function onDelete(logId: string) {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteStudyLog(logId);
    await load();
  }

  if (loading || book === undefined) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;
  if (book === null) return <p className="p-6 text-sm text-gray-500">見つかりませんでした。</p>;

  return (
    <main className={PAGE_CLASS}>
      <header className={HEADER_CLASS}>
        <div className="mx-auto max-w-2xl">
          <button onClick={() => router.push("/student")} className="text-sm text-gray-400">
            ← 参考書一覧
          </button>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">参考書の進捗</h1>
          <p className="mt-1 text-xs leading-5 text-gray-500">やったページをタップして、まとめて記録できます。</p>
        </div>
      </header>

      <div className={CONTENT_CLASS}>
        <button onClick={() => router.push("/student")} className="text-sm text-gray-400">
          ← 参考書を選びなおす
        </button>

        <div className={CARD_CLASS}>
          <p className="text-sm font-semibold">{book.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {pagesRead}ページ記録済み（全{book.total_pages ?? 0}ページ中）
          </p>
        </div>

        {!book.total_pages ? (
          <section className={CARD_CLASS}>
            <p className="text-sm text-gray-500">先生がまだページ数を設定していません。</p>
          </section>
        ) : (
          <>
            <section className={`space-y-2 ${CARD_CLASS}`}>
              <p className="text-xs font-semibold text-gray-700">まとめて選ぶ</p>
              <form onSubmit={onAddRange} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value.replace(/\D/g, ""))}
                    placeholder="開始p"
                    inputMode="numeric"
                    aria-label="開始ページ"
                    className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value.replace(/\D/g, ""))}
                    placeholder="終了p"
                    inputMode="numeric"
                    aria-label="終了ページ"
                    className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <button type="submit" className={`w-full ${OUTLINE_BUTTON_CLASS}`}>
                  選択に追加
                </button>
              </form>
            </section>

            <section className={`space-y-2 ${CARD_CLASS}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700">タップして選ぶ</p>
                <CycleLegend />
              </div>

              <form onSubmit={onJump} className="flex items-center gap-2">
                <input
                  value={jumpTo}
                  onChange={(e) => setJumpTo(e.target.value.replace(/\D/g, ""))}
                  placeholder="ページ番号"
                  inputMode="numeric"
                  aria-label="移動したいページ番号"
                  className="w-24 min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button type="submit" className={OUTLINE_BUTTON_CLASS}>
                  そのページへ移動
                </button>
              </form>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100 p-2">
                <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                  {Array.from({ length: book.total_pages }, (_, i) => i + 1).map((p) => {
                    const isSelected = selected.has(p);
                    const count = counts.get(p) ?? 0;
                    return (
                      <button
                        key={p}
                        data-page={p}
                        aria-label={`${p}ページ`}
                        aria-pressed={isSelected}
                        onClick={() => onTogglePage(p)}
                        className={`h-7 w-7 shrink-0 rounded text-[9px] font-medium transition ${isSelected ? "bg-emerald-500 text-white" : cycleColorClass(count)}`}
                        title={`${p}ページ（累計${count}回）`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <details className={CARD_CLASS}>
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">これまでの記録（{logs.length}件）</summary>
              {logs.length === 0 ? (
                <p className="mt-3 text-xs text-gray-400">まだ記録がありません。</p>
              ) : (
                <ul className="mt-3 divide-y divide-gray-100">
                  {logs.map((log) => (
                    <li key={log.id} className="py-2 text-xs">
                      {editingId === log.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={editFrom}
                            onChange={(e) => setEditFrom(e.target.value.replace(/\D/g, ""))}
                            className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs"
                          />
                          〜
                          <input
                            value={editTo}
                            onChange={(e) => setEditTo(e.target.value.replace(/\D/g, ""))}
                            className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs"
                          />
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="rounded border border-gray-300 px-1.5 py-1 text-xs"
                          />
                          <button onClick={saveEdit} className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white">
                            保存
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-700">
                            やめる
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-600">
                            {log.studied_on} ・ p.{log.page_start}-{log.page_end}
                            {log.understanding !== null && ` ・ 理解度 ${log.understanding}（${understandingLabel(log.understanding)}）`}
                          </span>
                          <span className="flex shrink-0 gap-2">
                            <button onClick={() => startEdit(log)} className="text-gray-500 underline">
                              編集
                            </button>
                            <button onClick={() => onDelete(log.id)} className="text-red-500 underline">
                              削除
                            </button>
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </details>

            <div className={`sticky bottom-0 z-10 space-y-2 rounded-2xl bg-white p-4 shadow-md`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-600">選択中: {selected.size}ページ</p>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  日付
                  <input
                    type="date"
                    aria-label="日付"
                    value={studiedOn}
                    onChange={(e) => setStudiedOn(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>理解度</span>
                  <span className="font-semibold text-gray-800">
                    {understanding.toFixed(1)}　{understandingLabel(understanding)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  aria-label="理解度"
                  value={understanding}
                  onChange={(e) => setUnderstanding(Number(e.target.value))}
                  className={RANGE_SLIDER_CLASS}
                />
              </div>
              <button onClick={onSave} disabled={selected.size === 0 || saving} className={`w-full ${PRIMARY_BUTTON_CLASS}`}>
                {saving ? "記録中…" : "記録する"}
              </button>
              <p className="text-[11px] text-gray-400">この記録は、クラスの先生に見えます。</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
