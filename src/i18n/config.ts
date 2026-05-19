export const DEFAULT_LANGUAGE = "en" as const;

export const SUPPORTED_LANGUAGES = ["en", "nl", "fr"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "lost_pets_lang";

export function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function resolveBrowserLanguage(): Language | null {
  if (typeof navigator === "undefined") return null;

  const code = navigator.language.split("-")[0]?.toLowerCase();
  if (code && isLanguage(code)) {
    return code;
  }

  return null;
}
