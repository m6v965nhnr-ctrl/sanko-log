"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/lib/auth";

// メールの再設定リンクから開き、新しいパスワードを決めるページ(リライトと同じ仕組み)
export default function ResetPasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // リンクの有効期限切れ・無効のときは、アドレスの後ろ(#)にエラーが付いてくる
    const hasLinkError = /error=|error_code=/.test(window.location.hash);

    // リンクを開いた直後は、アプリが自動で「再設定用のログイン状態」を作る(完了を待ってから確認する)
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setState(session && !hasLinkError ? "ready" : "invalid");
    }, 600);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) setState("ready");
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }
    if (password !== confirm) {
      setError("確認用のパスワードが一致しません");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      if (/same|different/i.test(error.message)) {
        setError("今までと違うパスワードにしてください");
      } else if (/weak|short|characters/i.test(error.message)) {
        setError("パスワードが短い、または簡単すぎます。別のパスワードにしてください");
      } else {
        setError("パスワードを変更できませんでした。リンクの期限が切れている可能性があります");
      }
      return;
    }

    setDone(true);
    const profile = await getMyProfile();
    setTimeout(() => {
      window.location.href = profile?.role === "teacher" ? "/teacher" : "/student";
    }, 1500);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">新しいパスワード</h1>

      {state === "checking" && <p className="mt-6 text-sm text-gray-400">確認しています…</p>}

      {state === "invalid" && (
        <div className="mt-6 space-y-3 rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-900">このリンクは使えません</p>
          <p className="text-sm leading-6 text-gray-600">
            リンクの有効期限が切れているか、すでに使われた可能性があります。もう一度、再設定のメールを送ってください。
          </p>
          <Link href="/forgot-password" className="inline-block rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white">
            再設定のメールを送る
          </Link>
        </div>
      )}

      {state === "ready" && !done && (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <p className="text-sm leading-6 text-gray-600">新しいパスワードを入力してください（8文字以上）。</p>
          <label className="text-sm font-medium text-gray-700">
            新しいパスワード
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            新しいパスワード（確認）
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-full bg-teal-600 px-6 py-3 text-base font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "変更中…" : "パスワードを変更する"}
          </button>
        </form>
      )}

      {done && <p className="mt-6 text-sm leading-6 text-gray-700">パスワードを変更しました。まもなく移動します…</p>}
    </main>
  );
}
