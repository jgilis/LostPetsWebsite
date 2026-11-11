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
      className="inline-flex items-center gap-1 rounded-full border border-lp-line bg-lp-paper p-0.5 text-[11px]"
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
                ? "bg-lp-sage text-white"
                : "text-lp-ink-muted hover:text-lp-ink"
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
