import { supabase } from "@/lib/supabase";
import type { Book, Profile, SchoolClass, StudyLog } from "@/lib/types";

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
  books: (Book & {
    pagesRead: number;
    latestComprehension: number | null;
    lastStudiedOn: string | null;
    logCount: number;
    bucketCounts: number[];
    logs: StudyLog[];
  })[];
};

// ページごとの記録回数(複数の記録をまたいだ、のべ回数)を、5段階(1回〜5回以上)のバケツに数える(進捗バー用)
function bucketPageCounts(logs: StudyLog[]): number[] {
  const perPage = new Map<number, number>();
  for (const log of logs) {
    for (let p = log.page_start; p <= log.page_end; p++) {
      perPage.set(p, (perPage.get(p) ?? 0) + 1);
    }
  }
  const buckets = [0, 0, 0, 0, 0];
  for (const count of perPage.values()) {
    buckets[Math.min(count, 5) - 1]++;
  }
  return buckets;
}

export async function getRoster(classId: string): Promise<RosterEntry[]> {
  const { data: members } = await supabase.from("class_members").select("profiles(*)").eq("class_id", classId);
  const students = (members ?? []).map((m) => m.profiles as unknown as Profile).filter(Boolean);
  if (students.length === 0) return [];

  const { data: books } = await supabase.from("books").select("*").eq("class_id", classId).order("created_at");
  const bookList = books ?? [];
  const bookIds = bookList.map((b) => b.id);

  // 本×学生ごとに進捗を集計する("bookId:studentId"をキーにする)
  const logsByBookStudent = new Map<string, StudyLog[]>();

  if (bookIds.length > 0) {
    const { data: logs } = await supabase.from("book_study_logs").select("*").in("book_id", bookIds).order("studied_on");
    for (const log of (logs ?? []) as StudyLog[]) {
      const key = `${log.book_id}:${log.student_id}`;
      const arr = logsByBookStudent.get(key) ?? [];
      arr.push(log);
      logsByBookStudent.set(key, arr);
    }
  }

  return students.map((student) => ({
    student,
    books: bookList.map((b) => {
      const key = `${b.id}:${student.id}`;
      const bookLogs = logsByBookStudent.get(key) ?? [];
      const pages = new Set<number>();
      for (const log of bookLogs) for (let p = log.page_start; p <= log.page_end; p++) pages.add(p);
      const latest = bookLogs.reduce<StudyLog | null>((acc, log) => (!acc || log.studied_on >= acc.studied_on ? log : acc), null);
      return {
        ...b,
        pagesRead: pages.size,
        latestComprehension: latest?.understanding ?? null,
        lastStudiedOn: latest?.studied_on ?? null,
        logCount: bookLogs.length,
        bucketCounts: bucketPageCounts(bookLogs),
        logs: [...bookLogs].sort((a, b2) => (a.studied_on < b2.studied_on ? 1 : -1)),
      };
    }),
  }));
}
