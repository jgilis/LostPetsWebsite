"use client";

import { useSyncExternalStore } from "react";

export const DESKTOP_LAYOUT_QUERY = "(min-width: 768px)";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_LAYOUT_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_LAYOUT_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
