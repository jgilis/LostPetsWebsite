"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  FLAG_REASON_CATEGORIES,
  MAX_FLAG_NOTE_LENGTH,
  flagReport,
  formatFlagReason,
  isFlagReasonCategory,
  type FlagReasonCategory,
} from "@/src/lib/flags";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

const REASON_LABELS: Record<FlagReasonCategory, TranslationKey> = {
  spam: "flagReasonSpam",
  wrong_animal: "flagReasonWrongAnimal",
  unsafe: "flagReasonUnsafe",
  other: "flagReasonOther",
};

type FlagReportSheetProps = {
  reportId: string;
  onClose: () => void;
};

export default function FlagReportSheet({
  reportId,
  onClose,
}: FlagReportSheetProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [category, setCategory] = useState<FlagReasonCategory | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || submitted) return;
    if (!isFlagReasonCategory(category)) {
      setError(t("flagNeedReason"));
      return;
    }

    setSubmitting(true);
    setError("");
    const ok = await flagReport(reportId, formatFlagReason(category, note));
    setSubmitting(false);

    if (!ok) {
      setError(t("flagFailed"));
      return;
    }

    setSubmitted(true);
  };

  const sheet = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("discoverDetailClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-t-2xl border border-lp-line bg-lp-paper p-6 text-lp-ink md:rounded-2xl"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {submitted ? t("flagSuccess") : t("flagSheetTitle")}
        </h2>

        {submitted ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-white px-4 text-sm font-medium text-black hover:opacity-90"
          >
            {t("sightingClose")}
          </button>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm text-lp-ink-muted">
                {t("flagSheetWhy")}
              </legend>
              <div className="space-y-2">
                {FLAG_REASON_CATEGORIES.map((value) => (
                  <label
                    key={value}
                    className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-lp-line px-3 text-sm hover:bg-lp-paper-muted"
                  >
                    <input
                      type="radio"
                      name="flag-reason"
                      value={value}
                      checked={category === value}
                      onChange={() => {
                        setCategory(value);
                        setError("");
                      }}
                    />
                    {t(REASON_LABELS[value])}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-sm text-lp-ink-muted">
                {t("flagNoteLabel")}
              </span>
              <textarea
                value={note}
                maxLength={MAX_FLAG_NOTE_LENGTH}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("flagNotePlaceholder")}
                className="min-h-[88px] w-full rounded-xl border border-lp-line bg-lp-paper-muted p-2 text-sm text-lp-ink"
              />
            </label>

            {error ? <p className="text-sm text-lp-coral">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting || !category}
                className="inline-flex min-h-[44px] items-center rounded-full bg-lp-coral px-4 text-sm font-medium text-white hover:bg-lp-coral/80 disabled:opacity-60"
              >
                {submitting ? t("flagSubmitting") : t("flagSubmit")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center rounded-full bg-lp-paper-muted px-4 text-sm text-lp-ink hover:bg-lp-line"
              >
                {t("sightingCancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}

export function FlagReportButton({
  reportId,
  className,
}: {
  reportId: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {t("flagPost")}
      </button>
      {open ? (
        <FlagReportSheet reportId={reportId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
