/**
 * Browser document visibility helpers (tab hide/show recovery).
 */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

export function onDocumentVisibilityChange(
  handler: () => void,
): () => void {
  if (typeof document === "undefined") return () => {};

  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
