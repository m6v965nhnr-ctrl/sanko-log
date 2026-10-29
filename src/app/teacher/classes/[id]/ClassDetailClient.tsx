"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { getClass, getRoster, type RosterEntry } from "@/lib/classes";
import type { SchoolClass } from "@/lib/types";

export default function ClassDetailClient({ id }: { id: string }) {
  const { profile, loading } = useProfile("teacher");
  const router = useRouter();
  const [cls, setCls] = useState<SchoolClass | null | undefined>(undefined);
  const [roster, setRoster] = useState<RosterEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const c = await getClass(id);
      setCls(c ?? null);
      if (c) setRoster(await getRoster(c.id));
    })();
  }, [profile, id]);

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
        <h2 className="text-sm font-bold text-gray-900">学生の進み具合（{roster.length}人）</h2>
        {roster.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだ学生が参加していません。</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {roster.map((r) => (
              <li key={r.student.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-bold text-gray-900">{r.student.display_name ?? "（名前未設定）"}</p>
                {r.books.length === 0 ? (
                  <p className="mt-1 text-xs text-gray-400">公開している参考書はありません。</p>
                ) : (
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
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
