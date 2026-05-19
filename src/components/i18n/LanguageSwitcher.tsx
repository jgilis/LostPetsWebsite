"use client";

import { SUPPORTED_LANGUAGES, type Language } from "@/src/i18n/config";
import { useTranslation } from "@/src/i18n/I18nProvider";

const LABELS: Record<Language, string> = {
  en: "EN",
  nl: "NL",
  fr: "FR",
};

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border border-gray-700/80 bg-gray-900/60 p-0.5 text-[11px]"
      role="group"
      aria-label={t("languageLabel")}
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`min-w-[2rem] rounded px-1.5 py-0.5 font-medium transition-colors ${
              active
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
            aria-pressed={active}
            aria-label={LABELS[code]}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
