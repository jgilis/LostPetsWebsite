import type { AuthError, User } from "@supabase/supabase-js";
import { safeAuthRedirectPath, writeAuthReturnPath } from "./authRedirect";
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
  // Query strings on emailRedirectTo are often dropped by the Auth allow-list.
  // Keep the intended return path in localStorage; land on the Site URL.
  writeAuthReturnPath(next);
  const emailRedirectTo = origin || undefined;

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
