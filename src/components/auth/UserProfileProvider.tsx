"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import {
  clearProfileAdminCache,
  fetchIsAdminForUser,
} from "@/src/lib/profileAdminCache";

type UserProfileContextValue = {
  user: User | null;
  userId: string | null;
  isAdmin: boolean;
  loading: boolean;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function useUserProfile() {
  const value = useContext(UserProfileContext);
  if (!value) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return value;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const resolvedUserIdRef = useRef<string | null>(null);

  const applySignedOut = useCallback(() => {
    resolvedUserIdRef.current = null;
    clearProfileAdminCache();
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
  }, []);

  const applySessionWithProfile = useCallback(
    async (nextUser: User | null) => {
      if (!nextUser) {
        applySignedOut();
        return;
      }

      setUser(nextUser);

      if (resolvedUserIdRef.current === nextUser.id) {
        setLoading(false);
        return;
      }

      resolvedUserIdRef.current = nextUser.id;
      const admin = await fetchIsAdminForUser(nextUser.id);
      setIsAdmin(admin);
      setLoading(false);
    },
    [applySignedOut],
  );

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        applySignedOut();
        return;
      }

      if (event === "INITIAL_SESSION") {
        void applySessionWithProfile(session?.user ?? null);
        return;
      }

      if (event === "SIGNED_IN") {
        void applySessionWithProfile(session?.user ?? null);
        return;
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySignedOut, applySessionWithProfile]);

  const value = useMemo(
    () => ({
      user,
      userId: user?.id ?? null,
      isAdmin,
      loading,
    }),
    [user, isAdmin, loading],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
