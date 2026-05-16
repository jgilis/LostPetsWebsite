"use client";

import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

function hasAuthParamsInHash(hash: string): boolean {
  if (!hash || hash === "#") return false;
  const query = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(query);
  return (
    params.has("access_token") ||
    params.has("refresh_token") ||
    params.has("error") ||
    params.has("error_description")
  );
}

function stripHashFromUrl() {
  if (!window.location.hash) return;
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", cleanUrl);
}

export default function AuthHashCleanup() {
  useEffect(() => {
    const hash = window.location.hash;

    // Lone "#" has no tokens — safe to remove immediately.
    if (hash === "#") {
      stripHashFromUrl();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;

      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
        return;
      }

      // After session is active, remove auth hash fragments (or leftover "#").
      if (!window.location.hash) return;

      if (hasAuthParamsInHash(window.location.hash)) {
        queueMicrotask(() => {
          stripHashFromUrl();
        });
        return;
      }

      stripHashFromUrl();
    });

    // Session already restored (e.g. refresh) with a leftover "#" only — no tokens in hash.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || !window.location.hash) return;
      if (!hasAuthParamsInHash(window.location.hash)) {
        stripHashFromUrl();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
