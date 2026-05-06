"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setIsAdmin(false);
        setLoading(false);
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userData.user.id)
        .single();

      if (error || !data?.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        window.location.href = "/login";
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    check();
  }, []);

  return { isAdmin, loading };
}