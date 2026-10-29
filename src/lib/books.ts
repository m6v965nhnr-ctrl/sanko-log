import { supabase } from "@/lib/supabase";
import type { Book, BookCycle, BookPageMark } from "@/lib/types";

export async function listMyBooks(userId: string): Promise<Book[]> {
  const { data } = await supabase.from("books").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBook(bookId: string): Promise<Book | null> {
  const { data } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
  return data;
}

export async function createBook(userId: string, title: string, totalPages: number | null): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .insert({ user_id: userId, title, total_pages: totalPages })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function setShowToTeacher(bookId: string, show: boolean) {
  const { error } = await supabase.from("books").update({ show_to_teacher: show }).eq("id", bookId);
  if (error) throw error;
}

export async function listCycles(bookId: string): Promise<BookCycle[]> {
  const { data } = await supabase.from("book_cycles").select("*").eq("book_id", bookId).order("cycle_number");
  return data ?? [];
}

// 周回を開始する(無ければ作る)。cycle_numberを返す
export async function ensureCycle(bookId: string, cycleNumber: number): Promise<void> {
  const { error } = await supabase.from("book_cycles").upsert({ book_id: bookId, cycle_number: cycleNumber }, { onConflict: "book_id,cycle_number", ignoreDuplicates: true });
  if (error) throw error;
}

export async function setComprehension(bookId: string, cycleNumber: number, comprehension: number) {
  const { error } = await supabase
    .from("book_cycles")
    .upsert({ book_id: bookId, cycle_number: cycleNumber, comprehension }, { onConflict: "book_id,cycle_number" });
  if (error) throw error;
}

export async function listPageMarks(bookId: string): Promise<BookPageMark[]> {
  const { data } = await supabase.from("book_page_marks").select("*").eq("book_id", bookId);
  return data ?? [];
}

export async function togglePageMark(bookId: string, cycleNumber: number, pageNumber: number, marked: boolean) {
  if (marked) {
    const { error } = await supabase.from("book_page_marks").insert({ book_id: bookId, cycle_number: cycleNumber, page_number: pageNumber });
    if (error && error.code !== "23505") throw error; // 重複は無視
  } else {
    const { error } = await supabase
      .from("book_page_marks")
      .delete()
      .eq("book_id", bookId)
      .eq("cycle_number", cycleNumber)
      .eq("page_number", pageNumber);
    if (error) throw error;
  }
}

export async function markPageRange(bookId: string, cycleNumber: number, from: number, to: number) {
  const rows = [];
  for (let p = from; p <= to; p++) rows.push({ book_id: bookId, cycle_number: cycleNumber, page_number: p });
  const { error } = await supabase.from("book_page_marks").upsert(rows, { onConflict: "book_id,cycle_number,page_number", ignoreDuplicates: true });
  if (error) throw error;
}

// ページごとの「のべ周回数」(色の濃さに使う)
export function countByPage(marks: BookPageMark[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const m of marks) map.set(m.page_number, (map.get(m.page_number) ?? 0) + 1);
  return map;
}
