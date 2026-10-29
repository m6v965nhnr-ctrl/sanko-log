import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-6 py-16 text-center">
      <p className="text-xs font-bold tracking-[0.14em] text-teal-700">参考書ログ</p>
      <h1 className="mt-3 text-3xl font-bold leading-snug text-gray-900 sm:text-4xl">
        参考書の進捗を、
        <br />
        クラスで共有できる。
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">
        ページの記録と理解度を、タップするだけで。先生はクラスを作って、参加コードを配るだけで、学生の進み具合をまとめて見られます。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-teal-600 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-teal-700"
        >
          無料ではじめる
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full border-2 border-teal-600 px-7 py-3 text-base font-bold text-teal-700 transition hover:bg-teal-50"
        >
          ログイン
        </Link>
      </div>
      <p className="mt-10 text-xs text-gray-400">学生は名前だけで、すぐ始められます。先生はメールで登録します。</p>
    </main>
  );
}
