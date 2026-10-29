"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { session } = await signUp(email, password, role, displayName);
      if (session) {
        router.push(role === "teacher" ? "/teacher" : "/student");
      } else {
        setError("確認メールを送りました。メール内のリンクを開いてから、ログインしてください。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">無料で登録</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold ${role === "student" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500"}`}
          >
            学生
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold ${role === "teacher" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500"}`}
          >
            先生
          </button>
        </div>
        <label className="text-sm font-medium text-gray-700">
          お名前
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            placeholder="例：山田太郎"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          メールアドレス
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          パスワード（8文字以上）
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-teal-600 px-6 py-3 text-base font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "登録中…" : "登録する"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        すでにアカウントをお持ちの方は <Link href="/login" className="font-bold text-teal-700 underline">ログイン</Link>
      </p>
    </main>
  );
}
