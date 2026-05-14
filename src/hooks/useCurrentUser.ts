"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCurrentUser() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();

      const user = userData.user;
      setUser(user);

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setIsAdmin(data?.is_admin ?? false);
      setLoading(false);
    };

    load();
  }, []);

  return {
    user,
    userId: user?.id ?? null,
    isAdmin,
    loading,
  };
}