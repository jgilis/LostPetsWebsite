"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;
const MAX_RETRY_ATTEMPTS = 12;

type SubscribeStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED"
  | string;

type UseResilientRealtimeChannelOptions = {
  channelName: string;
  enabled?: boolean;
  configure: (channel: RealtimeChannel) => RealtimeChannel;
  onReconnect?: () => void;
  onStatusChange?: (status: SubscribeStatus) => void;
};

export function useResilientRealtimeChannel({
  channelName,
  enabled = true,
  configure,
  onReconnect,
  onStatusChange,
}: UseResilientRealtimeChannelOptions) {
  const configureRef = useRef(configure);
  configureRef.current = configure;
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const hadFailureRef = useRef(false);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      return undefined;
    }

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const removeChannel = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const scheduleRetry = () => {
      clearRetryTimer();

      if (retryAttemptRef.current >= MAX_RETRY_ATTEMPTS) {
        console.warn(
          `[realtime:${channelName}] max retry attempts reached; will retry on next visibility/focus`,
        );
        return;
      }

      const delay = Math.min(
        RETRY_BASE_MS * 2 ** retryAttemptRef.current,
        RETRY_MAX_MS,
      );
      retryAttemptRef.current += 1;

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (mountedRef.current) {
          subscribe();
        }
      }, delay);
    };

    const subscribe = () => {
      removeChannel();

      const channel = configureRef.current(supabase.channel(channelName));
      channelRef.current = channel;

      channel.subscribe((status: SubscribeStatus, err) => {
        if (!mountedRef.current) return;

        if (err) {
          console.warn(`[realtime:${channelName}]`, err);
        }

        onStatusChangeRef.current?.(status);

        if (status === "SUBSCRIBED") {
          if (hadFailureRef.current) {
            hadFailureRef.current = false;
            retryAttemptRef.current = 0;
            onReconnectRef.current?.();
          }
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          hadFailureRef.current = true;
          scheduleRetry();
        }
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !mountedRef.current) return;

      if (
        retryAttemptRef.current >= MAX_RETRY_ATTEMPTS ||
        hadFailureRef.current
      ) {
        retryAttemptRef.current = 0;
        subscribe();
      }
    };

    subscribe();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearRetryTimer();
      removeChannel();
      hadFailureRef.current = false;
      retryAttemptRef.current = 0;
    };
  }, [channelName, enabled]);
}
