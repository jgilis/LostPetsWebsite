import { supabase } from "./supabase";

type ProfileCacheEntry = {
  userId: string;
  isAdmin: boolean;
};

let cached: ProfileCacheEntry | null = null;
const inflight = new Map<string, Promise<boolean>>();

export function clearProfileAdminCache() {
  cached = null;
  inflight.clear();
}

export async function fetchIsAdminForUser(userId: string): Promise<boolean> {
  if (cached?.userId === userId) {
    return cached.isAdmin;
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
    cached = { userId, isAdmin };
    return isAdmin;
  })();

  inflight.set(userId, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(userId);
  }
}
