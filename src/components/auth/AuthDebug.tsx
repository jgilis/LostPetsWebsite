"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type SessionSnapshot = {
  hasSession: boolean;
  userId: string | null;
  email: string | null;
  getUserError: string | null;
};

async function readSessionSnapshot(): Promise<SessionSnapshot> {
  const { data: sessionData } = await supabase.auth.getSession();
  const hasSession = sessionData.session !== null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  const snapshot: SessionSnapshot = {
    hasSession,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    getUserError: userError?.message ?? null,
  };

  console.log("[AuthDebug] session exists:", hasSession);
  console.log("[AuthDebug] user id:", snapshot.userId);
  console.log("[AuthDebug] email:", snapshot.email);
  if (userError) {
    console.log("[AuthDebug] getUser error:", userError.message);
  }

  return snapshot;
}

export function AuthDebug() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      setChecking(true);
      const next = await readSessionSnapshot();
      if (active) {
        setSnapshot(next);
        setChecking(false);
      }
    };

    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1rem",
        border: "1px dashed #999",
        fontSize: "0.875rem",
        color: "#444",
      }}
      aria-label="Auth session debug (temporary)"
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Session debug (read-only)</p>
      {checking && !snapshot && <p style={{ marginTop: "0.5rem" }}>Checking…</p>}
      {snapshot && (
        <ul style={{ marginTop: "0.5rem", marginBottom: 0, paddingLeft: "1.25rem" }}>
          <li>Session: {snapshot.hasSession ? "yes" : "no"}</li>
          <li>User id: {snapshot.userId ?? "—"}</li>
          <li>Email: {snapshot.email ?? "—"}</li>
          {snapshot.getUserError && (
            <li style={{ color: "red" }}>getUser: {snapshot.getUserError}</li>
          )}
        </ul>
      )}
      {snapshot?.hasSession && snapshot.email && (
        <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>
          Logged in as: {snapshot.email}
        </p>
      )}
      {snapshot?.hasSession && !snapshot.email && snapshot.userId && (
        <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>
          Logged in as: {snapshot.userId}
        </p>
      )}
      {!checking && snapshot && !snapshot.hasSession && (
        <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>Not logged in</p>
      )}
    </section>
  );
}
