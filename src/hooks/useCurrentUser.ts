"use client";

import { useUserProfile } from "@/src/components/auth/UserProfileProvider";

export function useCurrentUser() {
  return useUserProfile();
}
