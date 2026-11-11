import type { AuthError, User } from "@supabase/supabase-js";
import { safeAuthRedirectPath } from "./authRedirect";
import { supabase } from "./supabase";

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signInWithEmail(
  email: string,
  nextPath?: string | null,
): Promise<{ error: AuthError | null }> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const next = safeAuthRedirectPath(nextPath);
  const emailRedirectTo = origin
    ? next
      ? `${origin}${next}`
      : origin
    : undefined;

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
