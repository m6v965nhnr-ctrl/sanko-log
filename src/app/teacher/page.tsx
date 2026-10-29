"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { createClass, listMyClasses } from "@/lib/classes";
import { signOut } from "@/lib/auth";
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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{profile.display_name ?? "先生"}さんのクラス</h1>
        <button onClick={() => signOut().then(() => location.assign("/login"))} className="text-sm text-gray-400 hover:text-gray-700">
          ログアウト
        </button>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-900">クラスをつくる</h2>
        <form onSubmit={onCreate} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="クラス名（例：3年A組）"
            required
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="学校名（任意）"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">
            作成
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-900">クラス一覧</h2>
        {classes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだクラスがありません。</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/teacher/classes/${c.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-teal-400">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{c.school_name ?? "学校名未設定"} ・ 参加コード：{c.join_code}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
