"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { createBook, listMyBooks } from "@/lib/books";
import { joinClassByCode } from "@/lib/classes";
import { signOut } from "@/lib/auth";
import type { Book } from "@/lib/types";

export default function StudentHome() {
  const { profile, loading } = useProfile("student");
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [code, setCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    listMyBooks(profile.id).then(setBooks);
  }, [profile]);

  async function onAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim()) return;
    setBusy(true);
    try {
      const book = await createBook(profile.id, title.trim(), pages ? Number(pages) : null);
      setBooks((prev) => [book, ...prev]);
      setTitle("");
      setPages("");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setJoinMsg(null);
    try {
      const cls = await joinClassByCode(code);
      setJoinMsg(`「${cls.name}」に参加しました`);
      setCode("");
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : "参加できませんでした");
    }
  }

  if (loading || !profile) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{profile.display_name ?? "学生"}さんの参考書</h1>
        <button onClick={() => signOut().then(() => location.assign("/login"))} className="text-sm text-gray-400 hover:text-gray-700">
          ログアウト
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-bold text-gray-900">クラスに参加する</h2>
        <form onSubmit={onJoin} className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6文字の参加コード"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base uppercase tracking-widest"
            maxLength={6}
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">
            参加
          </button>
        </form>
        {joinMsg && <p className="mt-2 text-sm text-gray-600">{joinMsg}</p>}
      </section>

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
            placeholder="総ページ数（任意）"
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:w-40"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700">
            追加
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-900">参考書一覧</h2>
        {books.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだ登録がありません。</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/student/books/${b.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-teal-400">
                  <p className="font-bold text-gray-900">{b.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{b.total_pages ? `全${b.total_pages}ページ` : "ページ数未設定"}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
