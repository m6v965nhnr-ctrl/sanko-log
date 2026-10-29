import { supabase } from "@/lib/supabase";
import type { Book, BookCycle, BookPageMark } from "@/lib/types";

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

export async function listCycles(bookId: string, studentId: string): Promise<BookCycle[]> {
  const { data } = await supabase.from("book_cycles").select("*").eq("book_id", bookId).eq("student_id", studentId).order("cycle_number");
  return data ?? [];
}

// 周回を開始する(無ければ作る)
export async function ensureCycle(bookId: string, studentId: string, cycleNumber: number): Promise<void> {
  const { error } = await supabase
    .from("book_cycles")
    .upsert({ book_id: bookId, student_id: studentId, cycle_number: cycleNumber }, { onConflict: "book_id,student_id,cycle_number", ignoreDuplicates: true });
  if (error) throw error;
}

export async function setComprehension(bookId: string, studentId: string, cycleNumber: number, comprehension: number) {
  const { error } = await supabase
    .from("book_cycles")
    .upsert({ book_id: bookId, student_id: studentId, cycle_number: cycleNumber, comprehension }, { onConflict: "book_id,student_id,cycle_number" });
  if (error) throw error;
}

export async function listPageMarks(bookId: string, studentId: string): Promise<BookPageMark[]> {
  const { data } = await supabase.from("book_page_marks").select("*").eq("book_id", bookId).eq("student_id", studentId);
  return data ?? [];
}

export async function togglePageMark(bookId: string, studentId: string, cycleNumber: number, pageNumber: number, marked: boolean) {
  if (marked) {
    const { error } = await supabase
      .from("book_page_marks")
      .insert({ book_id: bookId, student_id: studentId, cycle_number: cycleNumber, page_number: pageNumber });
    if (error && error.code !== "23505") throw error; // 重複は無視
  } else {
    const { error } = await supabase
      .from("book_page_marks")
      .delete()
      .eq("book_id", bookId)
      .eq("student_id", studentId)
      .eq("cycle_number", cycleNumber)
      .eq("page_number", pageNumber);
    if (error) throw error;
  }
}

export async function markPageRange(bookId: string, studentId: string, cycleNumber: number, from: number, to: number) {
  const rows = [];
  for (let p = from; p <= to; p++) rows.push({ book_id: bookId, student_id: studentId, cycle_number: cycleNumber, page_number: p });
  const { error } = await supabase
    .from("book_page_marks")
    .upsert(rows, { onConflict: "book_id,student_id,cycle_number,page_number", ignoreDuplicates: true });
  if (error) throw error;
}

// ページごとの「のべ周回数」(色の濃さに使う)
export function countByPage(marks: BookPageMark[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const m of marks) map.set(m.page_number, (map.get(m.page_number) ?? 0) + 1);
  return map;
}
