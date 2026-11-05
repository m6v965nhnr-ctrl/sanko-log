"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { createBook, listClassBooks } from "@/lib/books";
import { getClass, getRoster, type RosterEntry } from "@/lib/classes";
import { CARD_CLASS, CONTENT_CLASS, HEADER_CLASS, PAGE_CLASS, PRIMARY_BUTTON_CLASS } from "@/lib/ui";
import { StudentProgressModal } from "@/components/StudentProgressModal";
import type { Book, SchoolClass } from "@/lib/types";

function countColor(logCount: number) {
  if (logCount === 0) return "text-gray-400";
  if (logCount === 1) return "text-emerald-700";
  if (logCount === 2) return "text-teal-700";
  if (logCount === 3) return "text-blue-700";
  if (logCount === 4) return "text-indigo-700";
  return "text-purple-700 font-semibold";
}

export default function ClassDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("teacher");
  const router = useRouter();
  const [cls, setCls] = useState<SchoolClass | null | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [busy, setBusy] = useState(false);
  const [openEntry, setOpenEntry] = useState<RosterEntry | null>(null);

  const reload = async () => {
    const [b, r] = await Promise.all([listClassBooks(id), getRoster(id)]);
    setBooks(b);
    setRoster(r);
  };

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const c = await getClass(id);
      setCls(c ?? null);
      if (c) await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, id]);

  async function onAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !pages) return;
    setBusy(true);
    try {
      await createBook(id, title.trim(), Number(pages));
      setTitle("");
      setPages("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading || cls === undefined) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;
  if (cls === null) return <p className="p-6 text-sm text-gray-500">見つかりませんでした。</p>;

  return (
    <main className={PAGE_CLASS}>
      <header className={HEADER_CLASS}>
        <div className="mx-auto max-w-2xl">
          <button onClick={() => router.push("/teacher")} className="text-sm text-gray-400">
            ← クラス一覧
          </button>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{cls.name}</h1>
          <p className="mt-1 text-xs leading-5 text-gray-500">{cls.school_name ?? "学校名未設定"}</p>
        </div>
      </header>

      <div className={CONTENT_CLASS}>
        <section className={CARD_CLASS}>
          <p className="text-xs font-bold text-teal-700">参加コード</p>
          <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-teal-900">{cls.join_code}</p>
          <p className="mt-1 text-xs text-gray-400">学生に、このコードを伝えてください。</p>
        </section>

        <section className={CARD_CLASS}>
          <h2 className="text-sm font-semibold text-gray-900">参考書を追加</h2>
          <form onSubmit={onAddBook} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="参考書の名前"
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={pages}
              onChange={(e) => setPages(e.target.value.replace(/\D/g, ""))}
              placeholder="総ページ数"
              inputMode="numeric"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-32"
            />
            <button type="submit" disabled={busy} className={`px-6 ${PRIMARY_BUTTON_CLASS}`}>
              追加
            </button>
          </form>
          {books.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              {books.map((b) => (
                <li key={b.id}>
                  {b.title}（全{b.total_pages}ページ）
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARD_CLASS}>
          <h2 className="text-sm font-semibold text-gray-900">学生の進み具合（{roster.length}人）</h2>
          {roster.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">まだ学生が参加していません。</p>
          ) : books.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">まだ参考書がありません。上の欄から追加してください。</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {roster.map((r) => {
                const logCount = r.books.reduce((sum, b) => sum + b.logCount, 0);
                const furthest = Math.max(0, ...r.books.map((b) => b.pagesRead));
                const lastStudiedOn = r.books.reduce<string | null>(
                  (acc, b) => (!acc || (b.lastStudiedOn && b.lastStudiedOn > acc) ? b.lastStudiedOn ?? acc : acc),
                  null
                );
                return (
                  <li key={r.student.id} className="py-1.5 text-xs">
                    <button
                      onClick={() => setOpenEntry(r)}
                      className="text-left font-medium text-sky-800 underline decoration-dotted"
                    >
                      {r.student.display_name ?? "（名前未設定）"}
                    </button>{" "}
                    <span className={countColor(logCount)}>
                      {logCount === 0 ? "記録なし" : `p.${furthest}まで（記録${logCount}回・最終 ${lastStudiedOn}）`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {openEntry && <StudentProgressModal entry={openEntry} onClose={() => setOpenEntry(null)} />}
    </main>
  );
}
