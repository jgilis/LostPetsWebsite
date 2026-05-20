"use client";

/** Report view surface: read-only content plus owner actions (edit → /edit, delete inline). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Report } from "@/src/lib/reports";
import { supabase } from "@/src/lib/supabase";
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
  const router = useRouter();
  const { user } = useCurrentUser();
  const [photoBroken, setPhotoBroken] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner =
    !!user?.id &&
    !!report.owner_user_id &&
    user.id === report.owner_user_id;

  const handleDelete = async () => {
    if (!isOwner || !user?.id || deleting) return;
    if (!window.confirm(t("reportDeleteConfirm"))) return;

    setDeleting(true);
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", report.id)
      .eq("owner_user_id", user.id);

    setDeleting(false);

    if (error) {
      window.alert(t("reportDeleteFailed"));
      return;
    }

    router.push(reportBackHref(from));
  };

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
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Sole in-app entry to /edit (mutation surface). */}
              <Link
                href={`/edit?id=${report.id}`}
                className="inline-block rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
              >
                {t("reportEdit")}
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-md bg-red-900/80 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-60"
              >
                {t("reportDelete")}
              </button>
            </div>
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
