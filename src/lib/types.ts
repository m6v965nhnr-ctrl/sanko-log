export type Role = "student" | "teacher";

export type Profile = {
  id: string;
  role: Role;
  display_name: string | null;
  school_name: string | null;
  created_at: string;
};

export type SchoolClass = {
  id: string;
  teacher_id: string;
  name: string;
  school_name: string | null;
  join_code: string;
  created_at: string;
};

export type Book = {
  id: string;
  class_id: string;
  title: string;
  total_pages: number | null;
  created_at: string;
};

// 1回の記録(ページ範囲・日付・任意の理解度)。過去の記録として、一覧・編集・削除ができる
export type StudyLog = {
  id: string;
  book_id: string;
  student_id: string;
  page_start: number;
  page_end: number;
  studied_on: string;
  understanding: number | null;
  created_at: string;
};
