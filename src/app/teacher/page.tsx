"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { createClass, listMyClasses } from "@/lib/classes";
import { signOut } from "@/lib/auth";
import { CARD_CLASS, CONTENT_CLASS, HEADER_CLASS, PAGE_CLASS, PRIMARY_BUTTON_CLASS } from "@/lib/ui";
import type { SchoolClass } from "@/lib/types";

export default function TeacherHome() {
  const { profile, loading } = useProfile("teacher");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    listMyClasses(profile.id).then(setClasses);
  }, [profile]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !name.trim()) return;
    setBusy(true);
    try {
      const cls = await createClass(profile.id, name.trim(), schoolName.trim());
      setClasses((prev) => [cls, ...prev]);
      setName("");
      setSchoolName("");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !profile) return <p className="p-6 text-sm text-gray-500">読み込み中…</p>;

  return (
    <main className={PAGE_CLASS}>
      <header className={HEADER_CLASS}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">参考書の進捗</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">{profile.display_name ?? "先生"}さんのクラス</h1>
          </div>
          <button onClick={() => signOut().then(() => location.assign("/login"))} className="text-sm text-gray-400">
            ログアウト
          </button>
        </div>
      </header>

      <div className={CONTENT_CLASS}>
        <section className={CARD_CLASS}>
          <h2 className="text-sm font-semibold text-gray-900">クラスをつくる</h2>
          <form onSubmit={onCreate} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="クラス名（例：3年A組）"
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="学校名（任意）"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={busy} className={PRIMARY_BUTTON_CLASS}>
              作成
            </button>
          </form>
        </section>

        <section>
          <h2 className="px-1 text-sm font-semibold text-gray-900">クラス一覧</h2>
          {classes.length === 0 ? (
            <p className={`mt-2 ${CARD_CLASS} text-sm text-gray-500`}>まだクラスがありません。</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {classes.map((c) => (
                <li key={c.id}>
                  <Link href={`/teacher/classes/${c.id}`} className={`block w-full text-left ${CARD_CLASS} transition active:bg-gray-50`}>
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{c.school_name ?? "学校名未設定"} ・ 参加コード：{c.join_code}</p>
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
