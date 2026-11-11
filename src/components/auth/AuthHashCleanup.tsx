"use client";

import { useEffect } from "react";
import { reportTaskHref } from "@/src/lib/homeDestination";
import {
  clearAuthReturnPath,
  isSameAppPath,
  peekAuthReturnPath,
} from "@/src/lib/authRedirect";
import { readReportDraft } from "@/src/lib/reportDraft";
import { supabase } from "@/src/lib/supabase";

function hasAuthParamsInHash(hash: string): boolean {
  if (!hash || hash === "#") return false;
  const query = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(query);
  return (
    params.has("access_token") ||
    params.has("refresh_token") ||
    params.has("error") ||
    params.has("error_description")
  );
}

function hasAuthCodeInSearch(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return params.has("code");
}

function isFreshAuthCallback(): boolean {
  return (
    hasAuthParamsInHash(window.location.hash) ||
    hasAuthCodeInSearch(window.location.search)
  );
}

function stripHashFromUrl() {
  if (!window.location.hash) return;
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", cleanUrl);
}

function currentPathAndSearch(): string {
  return window.location.pathname + window.location.search;
}

function canApplyStoredReturn(pathname: string, search: string): boolean {
  if (pathname === "/login") return true;
  if (pathname !== "/") return false;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (params.has("code")) return true;
  const tab = params.get("tab");
  // Bare `/` is Discover (PWA start_url). Do not yank it to a leftover
  // Report return path — that looks like a full-screen refresh.
  return tab === "report" || tab === "help";
}

function draftReturnPath(): string | null {
  const draft = readReportDraft();
  if (draft?.type === "lost" || draft?.type === "found") {
    return reportTaskHref(draft.type);
  }
  return null;
}

function goToPostAuthReturn(freshAuth: boolean) {
  const stored = peekAuthReturnPath();
  const applyStored =
    Boolean(stored) &&
    (freshAuth ||
      canApplyStoredReturn(window.location.pathname, window.location.search));
  const next = applyStored ? stored : freshAuth ? draftReturnPath() : null;

  if (applyStored) {
    clearAuthReturnPath();
  }
  if (!next) return;
  if (isSameAppPath(currentPathAndSearch(), next)) return;

  window.location.replace(next);
}

export default function AuthHashCleanup() {
  useEffect(() => {
    const freshAuth = isFreshAuthCallback();
    const hash = window.location.hash;
    let handled = false;

    // Lone "#" has no tokens — safe to remove immediately.
    if (hash === "#") {
      stripHashFromUrl();
    }

    const finish = () => {
      if (handled) return;
      handled = true;

      if (window.location.hash) {
        if (hasAuthParamsInHash(window.location.hash)) {
          queueMicrotask(() => {
            stripHashFromUrl();
          });
        } else {
          stripHashFromUrl();
        }
      }

      queueMicrotask(() => {
        goToPostAuthReturn(freshAuth);
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
        return;
      }
      finish();
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      finish();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
