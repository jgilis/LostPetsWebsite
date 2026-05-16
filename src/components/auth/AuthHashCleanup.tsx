"use client";

import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

function stripHashFromUrl() {
  const { pathname, search, hash } = window.location;
  if (!hash || hash === "#") {
    if (hash === "#") {
      window.history.replaceState(null, "", pathname + search);
    }
    return;
  }

  window.history.replaceState(null, "", pathname + search);
}

export default function AuthHashCleanup() {
  useEffect(() => {
    if (window.location.hash === "#") {
      stripHashFromUrl();
    }

    void supabase.auth.getSession().then(() => {
      stripHashFromUrl();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        stripHashFromUrl();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
