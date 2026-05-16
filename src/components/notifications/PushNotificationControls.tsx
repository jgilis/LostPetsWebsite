"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushEnabledForUser,
  isPushSupported,
} from "@/src/lib/pushNotifications";

export default function PushNotificationControls() {
  const [userId, setUserId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string) => {
    const isEnabled = await getPushEnabledForUser(uid);
    setEnabled(isEnabled);
    setChecking(false);
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setChecking(false);
        return;
      }

      await refresh(uid);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      setMessage(null);
      if (uid) {
        setChecking(true);
        void refresh(uid);
      } else {
        setEnabled(false);
        setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  if (!userId || checking) {
    return null;
  }

  if (!isPushSupported()) {
    return null;
  }

  const handleEnable = async () => {
    setBusy(true);
    setMessage(null);

    const result = await enablePushNotifications(userId);

    setBusy(false);

    if (result.ok) {
      setEnabled(true);
      setMessage(null);
      return;
    }

    if (result.reason === "denied") {
      setMessage("Notifications are blocked in browser settings.");
      return;
    }

    if (result.reason === "not_configured") {
      setMessage("Push is not configured on this deployment yet.");
      return;
    }

    setMessage(result.message ?? "Could not enable notifications.");
  };

  const handleDisable = async () => {
    setBusy(true);
    setMessage(null);
    await disablePushNotifications(userId);
    setEnabled(false);
    setBusy(false);
  };

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-gray-600" aria-hidden="true">
          ·
        </span>
        {enabled ? (
          <button
            type="button"
            onClick={() => void handleDisable()}
            disabled={busy}
            className="text-gray-300 underline hover:text-white disabled:opacity-50"
          >
            {busy ? "Updating…" : "Disable notifications"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={busy}
            className="text-gray-300 underline hover:text-white disabled:opacity-50"
          >
            {busy ? "Enabling…" : "Enable notifications 🔔"}
          </button>
        )}
      </span>
      {message && (
        <span className="max-w-xs text-center text-[11px] text-amber-400/90">
          {message}
        </span>
      )}
    </span>
  );
}
