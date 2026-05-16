"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type DependencyList,
  type ReactNode,
} from "react";

type SyncFn = () => void | Promise<void>;

type RegisterSync = (fn: SyncFn) => () => void;

const VisibilitySyncContext = createContext<RegisterSync | null>(null);

const DEBOUNCE_MS = 400;

export function useVisibilitySyncRegister(
  fn: SyncFn,
  deps: DependencyList,
) {
  const register = useContext(VisibilitySyncContext);

  useEffect(() => {
    if (!register) return;
    return register(fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [register, ...deps]);
}

export function VisibilitySyncProvider({ children }: { children: ReactNode }) {
  const callbacksRef = useRef(new Set<SyncFn>());
  const wasHiddenRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const register = useCallback<RegisterSync>((fn) => {
    callbacksRef.current.add(fn);
    return () => {
      callbacksRef.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    const runSync = () => {
      for (const fn of callbacksRef.current) {
        void Promise.resolve(fn()).catch((error) => {
          console.error("[VisibilitySync]", error);
        });
      }
    };

    const scheduleSync = () => {
      if (!wasHiddenRef.current) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        runSync();
      }, DEBOUNCE_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
        return;
      }

      if (document.visibilityState === "visible") {
        scheduleSync();
      }
    };

    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      scheduleSync();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <VisibilitySyncContext.Provider value={register}>
      {children}
    </VisibilitySyncContext.Provider>
  );
}
