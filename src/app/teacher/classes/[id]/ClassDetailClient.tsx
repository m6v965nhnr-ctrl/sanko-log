"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { createBook, listClassBooks } from "@/lib/books";
import { getClass, getRoster, type RosterEntry } from "@/lib/classes";
import type { Book, SchoolClass } from "@/lib/types";

export default function ClassDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("teacher");
  const router = useRouter();
  const [cls, setCls] = useState<SchoolClass | null | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [busy, setBusy] = useState(false);

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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <button onClick={() => router.push("/teacher")} className="text-sm text-gray-400 hover:text-gray-700">
        ← クラス一覧
      </button>
      <h1 className="mt-2 text-xl font-bold text-gray-900">{cls.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{cls.school_name ?? "学校名未設定"}</p>

      <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-xs font-bold text-teal-700">参加コード</p>
        <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-teal-900">{cls.join_code}</p>
        <p className="mt-1 text-xs text-teal-700">学生に、このコードを伝えてください。</p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-900">参考書を追加</h2>
        <form onSubmit={onAddBook} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="参考書の名前"
            required
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          <input
            value={pages}
            onChange={(e) => setPages(e.target.value.replace(/\D/g, ""))}
            placeholder="総ページ数"
            inputMode="numeric"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:w-32"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">
            追加
          </button>
        </form>
        {books.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {books.map((b) => (
              <li key={b.id}>
                {b.title}（全{b.total_pages}ページ）
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-900">学生の進み具合（{roster.length}人）</h2>
        {roster.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだ学生が参加していません。</p>
        ) : books.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだ参考書がありません。上の欄から追加してください。</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {roster.map((r) => (
              <li key={r.student.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-bold text-gray-900">{r.student.display_name ?? "（名前未設定）"}</p>
                <ul className="mt-2 space-y-1.5">
                  {r.books.map((b) => (
                    <li key={b.id} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{b.title}</span>
                      {" ・ "}
                      {b.total_pages ? `${b.pagesRead}/${b.total_pages}ページ` : `${b.pagesRead}ページ`}
                      {" ・ "}
                      {b.maxCycle}周目
                      {b.latestComprehension !== null && ` ・ 理解度 ${b.latestComprehension}`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
