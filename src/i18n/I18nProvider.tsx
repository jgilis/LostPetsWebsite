"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  resolveBrowserLanguage,
  type Language,
} from "./config";
import { dictionaries } from "./dictionaries";
import type { TranslationKey } from "./types";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** Client-only: never call during render or SSR. */
function resolveClientLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isLanguage(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }

  return resolveBrowserLanguage() ?? DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Server + first client paint always use DEFAULT_LANGUAGE (matches SSR HTML).
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  // Client-only: runs after mount, before paint (useLayoutEffect). Never during SSR.
  useLayoutEffect(() => {
    const resolved = resolveClientLanguage();
    setLanguageState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      dictionaries[language][key] ??
      dictionaries[DEFAULT_LANGUAGE][key] ??
      key,
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useTranslation() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return value;
}
