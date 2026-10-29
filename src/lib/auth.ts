import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export async function signUp(email: string, password: string, role: Role, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

// 学生は、メール・パスワードなし。名前だけで始められる(匿名ログイン)
export async function startAsStudent(displayName: string) {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { role: "student", display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  return data;
}
