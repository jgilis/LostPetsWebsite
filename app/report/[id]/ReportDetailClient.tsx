"use client";

import Link from "next/link";
import { useState } from "react";
import type { Report } from "@/src/lib/reports";
import {
  reportBackHref,
  type ReportFromContext,
} from "@/src/lib/reportNavigation";
import {
  formatReportLocation,
} from "@/src/lib/adminReports";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

function backLabelKey(from: ReportFromContext): TranslationKey {
  if (from === "feed") return "reportBackToFeed";
  if (from === "map") return "reportBackToMap";
  return "reportBack";
}

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

export default function ReportDetailClient({
  report,
  from = null,
}: {
  report: Report;
  from?: ReportFromContext;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [photoBroken, setPhotoBroken] = useState(false);
  const isOwner =
    !!user?.id &&
    !!report.owner_user_id &&
    user.id === report.owner_user_id;

  const location = formatReportLocation(report.latitude, report.longitude);
  const reportedAt = formatReportTimestampDisplay(report);
  const description =
    report.description?.trim() || t("adminNoDescription");
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto mb-4 max-w-lg">
        <Link
          href={reportBackHref(from)}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm text-gray-400 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          <span aria-hidden>←</span>
          {t(backLabelKey(from))}
        </Link>
      </div>
      <article className="mx-auto max-w-lg space-y-5">
        {report.photo_url && !photoBroken ? (
          <img
            src={report.photo_url}
            alt=""
            className="w-full max-h-80 rounded-lg border border-gray-700 object-cover"
            onError={() => setPhotoBroken(true)}
          />
        ) : (
          <div
            className="flex h-48 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-900/60 text-sm text-gray-500"
            aria-hidden
          >
            —
          </div>
        )}

        <header className="space-y-1">
          <h1 className="text-2xl font-bold capitalize text-white">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])}
          </h1>
          <p className="text-base text-gray-300">
            <span className="font-medium">{typeLabel}</span>
            {report.animal_name ? (
              <span className="text-gray-400">
                {" "}
                · {report.animal_name}
              </span>
            ) : null}
          </p>
        </header>

        {isOwner ? (
          <section
            className="rounded-lg border border-sky-900/50 bg-sky-950/30 px-4 py-3"
            aria-label={t("reportYouCreatedThis")}
          >
            <p className="text-sm font-medium text-sky-200/90">
              {t("reportYouCreatedThis")}
            </p>
            <a
              href={`/edit?id=${report.id}`}
              className="mt-3 inline-block rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
            >
              {t("reportEditOrDelete")}
            </a>
          </section>
        ) : null}

        {reportedAt ? (
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">{t("adminReported")}:</span>{" "}
            {reportedAt}
          </p>
        ) : null}

        {location ? (
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">{t("adminLocation")}:</span>{" "}
            {location}
          </p>
        ) : null}

        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-500">
            {t("reportDescription")}
          </h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-200">
            {description}
          </p>
        </section>

        <p className="pt-2 text-xs text-gray-600">
          {t("reportDetailId")}: {report.id}
        </p>
      </article>
    </main>
  );
}
