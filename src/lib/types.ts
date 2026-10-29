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

export type BookCycle = {
  id: string;
  book_id: string;
  student_id: string;
  cycle_number: number;
  comprehension: number | null;
  created_at: string;
};

export type BookPageMark = {
  book_id: string;
  student_id: string;
  cycle_number: number;
  page_number: number;
  marked_at: string;
};
