// RLS/RPCの動作を、実際のSupabaseプロジェクトに対して確認するスクリプト(手動実行用)
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import assert from "node:assert/strict";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("="))
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function client() {
  return createClient(url, key, { auth: { persistSession: false } });
}

const teacherEmail = "sankolog-teacher-test@mailinator.com";
const studentEmail = "student-verify@mailinator.com";
const password = "TestPass1234";

async function main() {
  const teacher = client();
  const { data: tAuth, error: tErr } = await teacher.auth.signInWithPassword({ email: teacherEmail, password });
  if (tErr) throw tErr;
  console.log("先生ログインOK:", tAuth.user.id);

  const { data: cls, error: cErr } = await teacher
    .from("classes")
    .insert({ teacher_id: tAuth.user.id, name: "検証クラス", school_name: "検証高校", join_code: "ABC123" })
    .select("*")
    .single();
  if (cErr) throw cErr;
  console.log("クラス作成OK:", cls.id, cls.join_code);

  const student = client();
  const { data: sAuth, error: sErr } = await student.auth.signInWithPassword({ email: studentEmail, password });
  if (sErr) throw sErr;
  console.log("学生ログインOK:", sAuth.user.id);

  // 他の先生のクラスへ、直接class_membersへinsertできない(RPC経由のみ)ことを確認
  const { error: directInsertErr } = await student.from("class_members").insert({ class_id: cls.id, student_id: sAuth.user.id });
  assert(directInsertErr, "class_membersへの直接insertは拒否されるべき");
  console.log("直接insert拒否OK:", directInsertErr.message);

  const { data: joinRes, error: joinErr } = await student.rpc("join_class", { p_code: "ABC123" });
  if (joinErr) throw joinErr;
  console.log("参加コードで参加OK:", joinRes);

  const { data: book, error: bErr } = await student
    .from("books")
    .insert({ user_id: sAuth.user.id, title: "検証用テキスト", total_pages: 100, show_to_teacher: true })
    .select("*")
    .single();
  if (bErr) throw bErr;
  console.log("本の登録OK:", book.id);

  const { error: markErr } = await student.from("book_page_marks").insert([
    { book_id: book.id, cycle_number: 1, page_number: 1 },
    { book_id: book.id, cycle_number: 1, page_number: 2 },
  ]);
  if (markErr) throw markErr;

  const { error: compErr } = await student.from("book_cycles").insert({ book_id: book.id, cycle_number: 1, comprehension: 7.5 });
  if (compErr) throw compErr;
  console.log("ページ記録・理解度の記録OK");

  // 先生から、生徒の本が見えるか(show_to_teacher=trueなので見えるはず)
  const { data: teacherSeesBook, error: tbErr } = await teacher.from("books").select("*").eq("id", book.id).maybeSingle();
  if (tbErr) throw tbErr;
  assert(teacherSeesBook, "先生から、公開設定の本が見えるべき");
  console.log("先生から本が見えるOK:", teacherSeesBook.title);

  // 先生から、生徒のプロフィール(名前)が見えるか
  const { data: teacherSeesProfile } = await teacher.from("profiles").select("*").eq("id", sAuth.user.id).maybeSingle();
  assert(teacherSeesProfile, "先生から、クラスの生徒のプロフィールが見えるべき");
  console.log("先生から生徒名が見えるOK:", teacherSeesProfile.display_name);

  // 生徒が公開をオフにしたら、先生から見えなくなるか
  await student.from("books").update({ show_to_teacher: false }).eq("id", book.id);
  const { data: afterHide } = await teacher.from("books").select("*").eq("id", book.id).maybeSingle();
  assert(!afterHide, "非公開にした本は、先生から見えなくなるべき");
  console.log("非公開化で見えなくなるOK");

  console.log("\n✅ 全項目OK");
}

main().catch((e) => {
  console.error("❌ ERROR", e.message ?? e);
  process.exit(1);
});
