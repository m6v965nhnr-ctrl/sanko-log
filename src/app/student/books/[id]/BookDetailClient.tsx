"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import {
  countByPage,
  ensureCycle,
  getBook,
  listCycles,
  listPageMarks,
  markPageRange,
  setComprehension,
  setShowToTeacher,
  togglePageMark,
} from "@/lib/books";
import { supabase } from "@/lib/supabase";
import type { Book, BookCycle, BookPageMark } from "@/lib/types";

const COLOR_BY_COUNT = [
  "bg-gray-100 text-gray-400", // 0回
  "bg-gray-200 text-gray-700", // 1回
  "bg-teal-200 text-teal-900", // 2回
  "bg-blue-300 text-blue-950", // 3回
  "bg-indigo-300 text-indigo-950", // 4回
  "bg-purple-400 text-white", // 5回以上
];

function colorClass(count: number) {
  return COLOR_BY_COUNT[Math.min(count, COLOR_BY_COUNT.length - 1)];
}

export default function BookDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("student");
  const router = useRouter();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [cycles, setCycles] = useState<BookCycle[]>([]);
  const [marks, setMarks] = useState<BookPageMark[]>([]);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [totalPagesInput, setTotalPagesInput] = useState("");

  const load = async () => {
    const b = await getBook(id);
    if (!b) {
      setBook(null);
      return;
    }
    setBook(b);
    const [cy, mk] = await Promise.all([listCycles(b.id), listPageMarks(b.id)]);
    setCycles(cy);
    setMarks(mk);
    setCurrentCycle(cy.length ? Math.max(...cy.map((c) => c.cycle_number)) : 1);
  };

  useEffect(() => {
    if (!profile) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, id]);

  const counts = useMemo(() => countByPage(marks), [marks]);
  const markedThisCycle = useMemo(
    () => new Set(marks.filter((m) => m.cycle_number === currentCycle).map((m) => m.page_number)),
    [marks, currentCycle]
  );
  const currentComprehension = cycles.find((c) => c.cycle_number === currentCycle)?.comprehension ?? null;

  async function onTogglePage(p: number) {
    if (!book) return;
    const marked = markedThisCycle.has(p);
    await ensureCycle(book.id, currentCycle);
    await togglePageMark(book.id, currentCycle, p, !marked);
    await load();
  }

  async function onMarkRange(e: React.FormEvent) {
    e.preventDefault();
    if (!book) return;
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!from || !to || from > to) return;
    await ensureCycle(book.id, currentCycle);
    await markPageRange(book.id, currentCycle, from, to);
    setRangeFrom("");
    setRangeTo("");
    await load();
  }

  async function onNextCycle() {
    if (!book) return;
    const next = currentCycle + 1;
    await ensureCycle(book.id, next);
    setCurrentCycle(next);
  }

  async function onComprehension(value: number) {
    if (!book) return;
    await ensureCycle(book.id, currentCycle);
    await setComprehension(book.id, currentCycle, value);
    await load();
  }

  async function onToggleShow() {
    if (!book) return;
    await setShowToTeacher(book.id, !book.show_to_teacher);
    setBook({ ...book, show_to_teacher: !book.show_to_teacher });
  }

  async function onSetTotalPages(e: React.FormEvent) {
    e.preventDefault();
    if (!book || !totalPagesInput) return;
    const { error } = await supabase.from("books").update({ total_pages: Number(totalPagesInput) }).eq("id", book.id);
    if (!error) setBook({ ...book, total_pages: Number(totalPagesInput) });
  }

  if (loading || book === undefined) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;
  if (book === null) return <p className="p-6 text-sm text-gray-500">見つかりませんでした。</p>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <button onClick={() => router.push("/student")} className="text-sm text-gray-400 hover:text-gray-700">
        ← 参考書一覧
      </button>
      <h1 className="mt-2 text-xl font-bold text-gray-900">{book.title}</h1>

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={book.show_to_teacher} onChange={onToggleShow} className="h-4 w-4" />
        先生に進み具合を見せる
      </label>

      {!book.total_pages ? (
        <form onSubmit={onSetTotalPages} className="mt-6 flex gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <input
            value={totalPagesInput}
            onChange={(e) => setTotalPagesInput(e.target.value.replace(/\D/g, ""))}
            placeholder="総ページ数"
            inputMode="numeric"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white">
            設定
          </button>
        </form>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">{currentCycle}周目</p>
            <button onClick={onNextCycle} className="rounded-full border-2 border-teal-600 px-4 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50">
              次の周へ
            </button>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500">理解度（この周）：{currentComprehension ?? "未記録"}</p>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={currentComprehension ?? 5}
              onChange={(e) => onComprehension(Number(e.target.value))}
              className="mt-1 w-full accent-teal-600"
            />
          </div>

          <form onSubmit={onMarkRange} className="mt-6 flex items-end gap-2">
            <label className="text-xs text-gray-500">
              範囲でまとめて記録
              <div className="mt-1 flex items-center gap-1">
                <input
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value.replace(/\D/g, ""))}
                  placeholder="開始"
                  inputMode="numeric"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
                〜
                <input
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value.replace(/\D/g, ""))}
                  placeholder="終了"
                  inputMode="numeric"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </label>
            <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">
              記録
            </button>
          </form>

          <div className="mt-6 grid grid-cols-10 gap-1.5 sm:grid-cols-12">
            {Array.from({ length: book.total_pages }, (_, i) => i + 1).map((p) => {
              const isMarkedNow = markedThisCycle.has(p);
              const count = counts.get(p) ?? 0;
              return (
                <button
                  key={p}
                  onClick={() => onTogglePage(p)}
                  className={`aspect-square rounded-md text-[10px] font-bold ring-2 transition ${colorClass(count)} ${isMarkedNow ? "ring-teal-600" : "ring-transparent"}`}
                  title={`${p}ページ（累計${count}回）`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-gray-400">
            タップで、この周の記録をオン・オフ。枠の色は、この周に記録済み。背景の濃さは、通算の記録回数（濃いほど多い）。
          </p>
        </>
      )}
    </main>
  );
}
