/**
 * ONLY module allowed to query `profiles` for `is_admin`.
 * All consumers must use UserProfileProvider / useUserProfile / useCurrentUser / useAdmin.
 */
import { supabase } from "./supabase";

const SESSION_STORAGE_KEY = "lost_pets_profile_admin_v1";

type ProfileCacheEntry = {
  userId: string;
  isAdmin: boolean;
};

let memoryCache: ProfileCacheEntry | null = null;
const inflight = new Map<string, Promise<boolean>>();

function readSessionCache(userId: string): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProfileCacheEntry;
    if (parsed.userId !== userId) return null;

    return parsed.isAdmin;
  } catch {
    return null;
  }
}

function writeSessionCache(entry: ProfileCacheEntry) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / private mode errors
  }
}

function clearSessionCache() {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearProfileAdminCache() {
  memoryCache = null;
  inflight.clear();
  clearSessionCache();
}

export async function fetchIsAdminForUser(userId: string): Promise<boolean> {
  if (memoryCache?.userId === userId) {
    return memoryCache.isAdmin;
  }

  const sessionCached = readSessionCache(userId);
  if (sessionCached !== null) {
    memoryCache = { userId, isAdmin: sessionCached };
    return sessionCached;
  }

  const pending = inflight.get(userId);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    const isAdmin = !error && (data?.is_admin ?? false);
    const entry = { userId, isAdmin };
    memoryCache = entry;
    writeSessionCache(entry);
    return isAdmin;
  })();

  inflight.set(userId, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(userId);
  }
}
