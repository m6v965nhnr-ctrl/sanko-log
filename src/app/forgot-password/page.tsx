"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// パスワードを忘れた人が、登録したメールアドレスに「再設定用のリンク」を受け取るページ(リライトと同じ仕組み)
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const address = email.trim();
    if (!address) return;

    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);

    // 登録されていないアドレスでも、エラーにならず同じ表示になる(登録の有無を知られないため)。
    // エラーになるのは、短時間に何度も送ったときや、メール送信そのものに失敗したとき
    if (error) {
      if (/rate|seconds|too many|limit/i.test(error.message)) {
        setError("短い間に何度も送れません。1分ほど待ってから、もう一度お試しください");
      } else {
        setError("メールを送れませんでした。時間をおいてもう一度お試しください");
      }
      return;
    }

    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <Link href="/login" className="text-sm text-gray-400">
        ← ログインに戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">パスワードの再設定</h1>

      {sent ? (
        <div className="mt-6 space-y-3 rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-900">メールを送りました</p>
          <p className="text-sm leading-6 text-gray-600">
            <span className="break-all font-medium">{email.trim()}</span>{" "}
            が登録されている場合は、パスワードを再設定するためのリンクをお送りしました。メールのリンクを開いて、新しいパスワードを設定してください。
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-gray-500">
            <li>届くまで、数分かかることがあります。</li>
            <li>迷惑メールフォルダも確認してください。</li>
            <li>リンクの有効期限は1時間です。切れたときは、もう一度やり直してください。</li>
          </ul>
          <button onClick={() => setSent(false)} className="text-xs text-gray-500 underline">
            メールアドレスを入力し直す
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <p className="text-sm leading-6 text-gray-600">
            登録したメールアドレスを入力してください。パスワードを再設定するためのリンクを、メールでお送りします。
          </p>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="mt-2 rounded-full bg-teal-600 px-6 py-3 text-base font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {sending ? "送信中…" : "再設定のメールを送る"}
          </button>
        </form>
      )}
    </main>
  );
}
