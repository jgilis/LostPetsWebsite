"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type DependencyList,
  type ReactNode,
} from "react";

type SyncFn = () => void | Promise<void>;

type RealtimeResyncContextValue = {
  registerResync: (fn: SyncFn) => () => void;
  scheduleResyncAfterReconnect: () => void;
};

const RealtimeResyncContext = createContext<RealtimeResyncContextValue | null>(
  null,
);

const RESYNC_DEBOUNCE_MS = 500;
const MIN_RESYNC_INTERVAL_MS = 5_000;

export function useRealtimeResyncRegister(fn: SyncFn, deps: DependencyList) {
  const ctx = useContext(RealtimeResyncContext);

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerResync(fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [ctx, ...deps]);
}

export function useScheduleResyncAfterReconnect() {
  const ctx = useContext(RealtimeResyncContext);
  return ctx?.scheduleResyncAfterReconnect ?? (() => {});
}

export function RealtimeResyncProvider({ children }: { children: ReactNode }) {
  const callbacksRef = useRef(new Set<SyncFn>());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResyncAtRef = useRef(0);

  const registerResync = useCallback((fn: SyncFn) => {
    callbacksRef.current.add(fn);
    return () => {
      callbacksRef.current.delete(fn);
    };
  }, []);

  const scheduleResyncAfterReconnect = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;

      const now = Date.now();
      if (now - lastResyncAtRef.current < MIN_RESYNC_INTERVAL_MS) {
        return;
      }
      lastResyncAtRef.current = now;

      for (const fn of callbacksRef.current) {
        void Promise.resolve(fn()).catch((error) => {
          console.error("[RealtimeResync]", error);
        });
      }
    }, RESYNC_DEBOUNCE_MS);
  }, []);

  const value = useMemo(
    () => ({ registerResync, scheduleResyncAfterReconnect }),
    [registerResync, scheduleResyncAfterReconnect],
  );

  return (
    <RealtimeResyncContext.Provider value={value}>
      {children}
    </RealtimeResyncContext.Provider>
  );
}
