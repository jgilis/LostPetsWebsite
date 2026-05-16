"use client";

import { useEffect } from "react";
import { useUserProfile } from "@/src/components/auth/UserProfileProvider";

export function useAdmin() {
  const { isAdmin, loading, user } = useUserProfile();

  useEffect(() => {
    if (loading) return;

    if (!user || !isAdmin) {
      window.location.href = "/login";
    }
  }, [loading, user, isAdmin]);

  return { isAdmin, loading };
}
