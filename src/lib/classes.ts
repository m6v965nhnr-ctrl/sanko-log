import { supabase } from "@/lib/supabase";
import type { Book, BookPageMark, Profile, SchoolClass } from "@/lib/types";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除く
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function listMyClasses(teacherId: string): Promise<SchoolClass[]> {
  const { data } = await supabase.from("classes").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClass(classId: string): Promise<SchoolClass | null> {
  const { data } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  return data;
}

export async function createClass(teacherId: string, name: string, schoolName: string): Promise<SchoolClass> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const join_code = randomCode();
    const { data, error } = await supabase
      .from("classes")
      .insert({ teacher_id: teacherId, name, school_name: schoolName || null, join_code })
      .select("*")
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error; // コードの重複以外はエラー
  }
  throw new Error("参加コードの発行に失敗しました。もう一度お試しください。");
}

export async function joinClassByCode(code: string): Promise<{ class_id: string; name: string; school_name: string | null }> {
  const { data, error } = await supabase.rpc("join_class", { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("参加コードが見つかりません");
  return row;
}

export async function listMyJoinedClasses(studentId: string): Promise<SchoolClass[]> {
  const { data } = await supabase
    .from("class_members")
    .select("classes(*)")
    .eq("student_id", studentId);
  return (data ?? []).map((r) => r.classes as unknown as SchoolClass).filter(Boolean);
}

export type RosterEntry = {
  student: Profile;
  books: (Book & { pagesRead: number; latestComprehension: number | null; maxCycle: number })[];
};

export async function getRoster(classId: string): Promise<RosterEntry[]> {
  const { data: members } = await supabase.from("class_members").select("profiles(*)").eq("class_id", classId);
  const students = (members ?? []).map((m) => m.profiles as unknown as Profile).filter(Boolean);
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const { data: books } = await supabase.from("books").select("*").in("user_id", studentIds).eq("show_to_teacher", true);
  const bookList = books ?? [];
  const bookIds = bookList.map((b) => b.id);

  const marksByBook = new Map<string, BookPageMark[]>();
  const latestCompByBook = new Map<string, number | null>();
  const maxCycleByBook = new Map<string, number>();

  if (bookIds.length > 0) {
    const { data: marks } = await supabase.from("book_page_marks").select("*").in("book_id", bookIds);
    for (const m of marks ?? []) {
      const arr = marksByBook.get(m.book_id) ?? [];
      arr.push(m);
      marksByBook.set(m.book_id, arr);
    }
    const { data: cycles } = await supabase.from("book_cycles").select("*").in("book_id", bookIds).order("cycle_number");
    for (const c of cycles ?? []) {
      maxCycleByBook.set(c.book_id, c.cycle_number);
      if (c.comprehension !== null) latestCompByBook.set(c.book_id, c.comprehension);
    }
  }

  return students.map((student) => ({
    student,
    books: bookList
      .filter((b) => b.user_id === student.id)
      .map((b) => ({
        ...b,
        pagesRead: new Set((marksByBook.get(b.id) ?? []).map((m) => m.page_number)).size,
        latestComprehension: latestCompByBook.get(b.id) ?? null,
        maxCycle: maxCycleByBook.get(b.id) ?? 1,
      })),
  }));
}
