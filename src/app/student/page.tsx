"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { listStudentBooks } from "@/lib/books";
import { joinClassByCode } from "@/lib/classes";
import { signOut } from "@/lib/auth";
import { CARD_CLASS, CONTENT_CLASS, HEADER_CLASS, PAGE_CLASS, PRIMARY_BUTTON_CLASS } from "@/lib/ui";
import type { Book } from "@/lib/types";

export default function StudentHome() {
  const { profile, loading } = useProfile("student");
  const [books, setBooks] = useState<(Book & { class_name: string | null })[]>([]);
  const [code, setCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    listStudentBooks(profile.id).then(setBooks);
  }, [profile]);

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !profile) return;
    setJoinMsg(null);
    try {
      const cls = await joinClassByCode(code);
      setJoinMsg(`「${cls.name}」に参加しました`);
      setCode("");
      listStudentBooks(profile.id).then(setBooks);
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : "参加できませんでした");
    }
  }

  if (loading || !profile) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;

  function onLogout() {
    if (!confirm("ログアウトすると、この端末の記録には二度と戻れません。本当によろしいですか？")) return;
    signOut().then(() => location.assign("/login"));
  }

  return (
    <main className={PAGE_CLASS}>
      <header className={HEADER_CLASS}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">参考書の進捗</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">{profile.display_name ?? "学生"}さん</h1>
          </div>
          <button onClick={onLogout} className="text-sm text-gray-400">
            ログアウト
          </button>
        </div>
      </header>

      <div className={CONTENT_CLASS}>
        <section className={CARD_CLASS}>
          <h2 className="text-sm font-semibold text-gray-900">クラスに参加する</h2>
          <form onSubmit={onJoin} className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6文字の参加コード"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest"
              maxLength={6}
            />
            <button type="submit" className={`px-6 ${PRIMARY_BUTTON_CLASS}`}>
              参加
            </button>
          </form>
          {joinMsg && <p className="mt-2 text-xs text-gray-500">{joinMsg}</p>}
        </section>

        <section>
          <h2 className="px-1 text-sm font-semibold text-gray-900">参考書一覧</h2>
          {books.length === 0 ? (
            <p className={`mt-2 ${CARD_CLASS} text-sm text-gray-500`}>
              まだありません。クラスに参加すると、先生が登録した参考書が出てきます。
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {books.map((b) => (
                <li key={b.id}>
                  <Link href={`/student/books/${b.id}`} className={`block w-full text-left ${CARD_CLASS} transition active:bg-gray-50`}>
                    <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {b.class_name ?? "クラス不明"} ・ {b.total_pages ? `全${b.total_pages}ページ` : "ページ数未設定"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
