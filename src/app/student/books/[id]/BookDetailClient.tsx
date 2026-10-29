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
  togglePageMark,
} from "@/lib/books";
import { CARD_CLASS, CONTENT_CLASS, cycleColorClass, HEADER_CLASS, OUTLINE_BUTTON_CLASS, PAGE_CLASS, PRIMARY_BUTTON_CLASS } from "@/lib/ui";
import { CycleLegend } from "@/components/CycleLegend";
import type { Book, BookCycle, BookPageMark } from "@/lib/types";

export default function BookDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("student");
  const router = useRouter();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [cycles, setCycles] = useState<BookCycle[]>([]);
  const [marks, setMarks] = useState<BookPageMark[]>([]);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const load = async () => {
    if (!profile) return;
    const b = await getBook(id);
    if (!b) {
      setBook(null);
      return;
    }
    setBook(b);
    const [cy, mk] = await Promise.all([listCycles(b.id, profile.id), listPageMarks(b.id, profile.id)]);
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
    if (!book || !profile) return;
    const marked = markedThisCycle.has(p);
    await ensureCycle(book.id, profile.id, currentCycle);
    await togglePageMark(book.id, profile.id, currentCycle, p, !marked);
    await load();
  }

  async function onMarkRange(e: React.FormEvent) {
    e.preventDefault();
    if (!book || !profile) return;
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!from || !to || from > to) return;
    await ensureCycle(book.id, profile.id, currentCycle);
    await markPageRange(book.id, profile.id, currentCycle, from, to);
    setRangeFrom("");
    setRangeTo("");
    await load();
  }

  async function onNextCycle() {
    if (!book || !profile) return;
    const next = currentCycle + 1;
    await ensureCycle(book.id, profile.id, next);
    setCurrentCycle(next);
  }

  async function onComprehension(value: number) {
    if (!book || !profile) return;
    await ensureCycle(book.id, profile.id, currentCycle);
    await setComprehension(book.id, profile.id, currentCycle, value);
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
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{book.title}</h1>
        </div>
      </header>

      <div className={CONTENT_CLASS}>
        {!book.total_pages ? (
          <section className={CARD_CLASS}>
            <p className="text-sm text-gray-500">先生がまだページ数を設定していません。</p>
          </section>
        ) : (
          <>
            <section className={CARD_CLASS}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{currentCycle}周目</p>
                <button onClick={onNextCycle} className={OUTLINE_BUTTON_CLASS}>
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
                  className="mt-1 w-full accent-emerald-500"
                />
              </div>
            </section>

            <section className={CARD_CLASS}>
              <p className="text-sm font-semibold text-gray-900">範囲でまとめて記録</p>
              <form onSubmit={onMarkRange} className="mt-2 flex items-center gap-2">
                <input
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value.replace(/\D/g, ""))}
                  placeholder="開始"
                  inputMode="numeric"
                  required
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
                〜
                <input
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value.replace(/\D/g, ""))}
                  placeholder="終了"
                  inputMode="numeric"
                  required
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button type="submit" className={PRIMARY_BUTTON_CLASS}>
                  記録
                </button>
              </form>
            </section>

            <section className={CARD_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">タップして記録</p>
                <CycleLegend />
              </div>
              <div className="mt-3 grid grid-cols-8 gap-1 sm:grid-cols-10">
                {Array.from({ length: book.total_pages }, (_, i) => i + 1).map((p) => {
                  const isMarkedNow = markedThisCycle.has(p);
                  const count = counts.get(p) ?? 0;
                  return (
                    <button
                      key={p}
                      onClick={() => onTogglePage(p)}
                      className={`h-7 w-7 rounded text-[10px] font-bold ring-2 transition ${cycleColorClass(count)} ${isMarkedNow ? "ring-emerald-600" : "ring-transparent"}`}
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
            </section>
          </>
        )}
      </div>
    </main>
  );
}
