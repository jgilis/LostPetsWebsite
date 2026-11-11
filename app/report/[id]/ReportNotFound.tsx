"use client";

import Link from "next/link";
import {
  reportBackHref,
  type ReportFromContext,
} from "@/src/lib/reportNavigation";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

function backLabelKey(from: ReportFromContext): TranslationKey {
  if (from === "feed") return "reportBackToFeed";
  if (from === "map") return "reportBackToMap";
  return "reportBack";
}

export default function ReportNotFound({
  from = null,
}: {
  from?: ReportFromContext;
}) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-lp-bg px-6 py-10 text-lp-ink">
      <div className="mx-auto max-w-lg">
        <Link
          href={reportBackHref(from)}
          className="mb-6 inline-flex min-h-[44px] items-center gap-1 text-sm text-lp-ink-muted underline-offset-2 hover:text-lp-ink hover:underline"
        >
          <span aria-hidden>←</span>
          {t(backLabelKey(from))}
        </Link>
        <p className="text-center text-lp-ink-muted">{t("reportDetailNotFound")}</p>
      </div>
    </main>
  );
}
