import { supabase } from "@/lib/supabase";
import type { Book, StudyLog } from "@/lib/types";

// クラスの参考書一覧(先生の画面用)
export async function listClassBooks(classId: string): Promise<Book[]> {
  const { data } = await supabase.from("books").select("*").eq("class_id", classId).order("created_at", { ascending: false });
  return data ?? [];
}

// 自分が参加している、すべてのクラスの参考書(学生の画面用)
export async function listStudentBooks(studentId: string): Promise<(Book & { class_name: string | null })[]> {
  const { data: memberships } = await supabase.from("class_members").select("class_id").eq("student_id", studentId);
  const classIds = (memberships ?? []).map((m) => m.class_id);
  if (classIds.length === 0) return [];

  const { data } = await supabase
    .from("books")
    .select("*, classes(name)")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });

  return (data ?? []).map((b) => {
    const { classes, ...book } = b as Book & { classes: { name: string } | null };
    return { ...book, class_name: classes?.name ?? null };
  });
}

export async function getBook(bookId: string): Promise<Book | null> {
  const { data } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
  return data;
}

// 参考書の追加は、先生だけができる(RLSでも制限)
export async function createBook(classId: string, title: string, totalPages: number): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .insert({ class_id: classId, title, total_pages: totalPages })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listStudyLogs(bookId: string, studentId: string): Promise<StudyLog[]> {
  const { data } = await supabase
    .from("book_study_logs")
    .select("*")
    .eq("book_id", bookId)
    .eq("student_id", studentId)
    .order("studied_on", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addStudyLog(
  bookId: string,
  studentId: string,
  pageStart: number,
  pageEnd: number,
  studiedOn: string,
  understanding: number | null
): Promise<StudyLog> {
  const { data, error } = await supabase
    .from("book_study_logs")
    .insert({ book_id: bookId, student_id: studentId, page_start: pageStart, page_end: pageEnd, studied_on: studiedOn, understanding })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudyLog(id: string, pageStart: number, pageEnd: number, studiedOn: string): Promise<void> {
  const { error } = await supabase
    .from("book_study_logs")
    .update({ page_start: pageStart, page_end: pageEnd, studied_on: studiedOn })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStudyLog(id: string): Promise<void> {
  const { error } = await supabase.from("book_study_logs").delete().eq("id", id);
  if (error) throw error;
}

// 複数の記録(ページ範囲)から、ページごとの通算記録回数を数える(色の濃さ・進捗バーに使う)
export function countByPageFromLogs(logs: StudyLog[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const log of logs) {
    for (let p = log.page_start; p <= log.page_end; p++) {
      map.set(p, (map.get(p) ?? 0) + 1);
    }
  }
  return map;
}

// 選んだページ番号の集合を、連続した範囲ごとに分ける(記録の保存に使う)
export function toPageRanges(pages: number[]): [number, number][] {
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: [number, number][] = [];
  let start: number | undefined;
  let prev: number | undefined;
  for (const p of sorted) {
    if (start === undefined) {
      start = p;
      prev = p;
      continue;
    }
    if (p === (prev as number) + 1) {
      prev = p;
      continue;
    }
    ranges.push([start, prev as number]);
    start = p;
    prev = p;
  }
  if (start !== undefined) ranges.push([start, prev as number]);
  return ranges;
}
