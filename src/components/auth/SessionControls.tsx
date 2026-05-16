"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/src/lib/auth";
import { supabase } from "@/src/lib/supabase";

export default function SessionControls() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    window.location.href = "/";
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <a href="/login" className="hover:text-gray-300">
        Login
      </a>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span className="text-gray-400">Logged in as {user.email ?? "user"}</span>
      <span className="text-gray-600" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={signingOut}
        className="text-gray-300 underline hover:text-white disabled:opacity-50"
      >
        {signingOut ? "Logging out…" : "Logout"}
      </button>
    </span>
  );
}
