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
      <a
        href="/login"
        className="text-gray-400 underline hover:text-gray-200"
      >
        Account
      </a>
    );
  }

  return (
    <details className="group relative text-left">
      <summary className="cursor-pointer list-none text-gray-400 underline hover:text-gray-200 [&::-webkit-details-marker]:hidden">
        Account
      </summary>
      <div className="absolute bottom-full left-1/2 z-10 mb-2 min-w-[8rem] -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-left shadow-lg">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          className="w-full text-left text-gray-300 underline hover:text-white disabled:opacity-50"
        >
          {signingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </details>
  );
}
