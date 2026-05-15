import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signInWithEmail(
  email: string,
): Promise<{ error: AuthError | null }> {
  const emailRedirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  return { error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}
