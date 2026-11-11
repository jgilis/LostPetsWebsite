"use client";

/** Report view surface: read-only content plus owner actions (edit → /edit, delete inline). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  canOwnerReopenReport,
  reopenOwnerReport,
  type Report,
  type ReportStatus,
} from "@/src/lib/reports";
import { supabase } from "@/src/lib/supabase";
import {
  reportBackHref,
  type ReportFromContext,
} from "@/src/lib/reportNavigation";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import { FlagReportButton } from "@/src/components/report/FlagReportSheet";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import PopupPhoto from "@/src/components/map/PopupPhoto";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { track } from "@/src/lib/analytics/analytics";
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
  report: initialReport,
  from = null,
  presentation = "page",
  onClose,
  onDeleted,
}: {
  report: Report;
  from?: ReportFromContext;
  presentation?: "page" | "sheet";
  onClose?: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [report, setReport] = useState(initialReport);
  const [photoBroken, setPhotoBroken] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    setReport(initialReport);
    setPhotoBroken(false);
  }, [initialReport.id]);
  const reportIsOwner = isOwner(user?.id, report.owner_user_id);
  const isResolved = report.status === "resolved";
  const isActive = report.status === "active";
  const isSheet = presentation === "sheet";

  useEffect(() => {
    track("report_viewed", {
      report_id: report.id,
    });
  }, [report.id]);

  const handleDelete = async () => {
    if (!reportIsOwner || !user?.id || deleting) return;
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

    onDeleted?.();
    if (isSheet) {
      onClose?.();
      return;
    }

    router.push(reportBackHref(from));
  };

  const handleMarkResolved = async () => {
    if (!reportIsOwner || !user?.id || !isActive || resolving) return;
    if (!window.confirm(t("reportMarkResolvedConfirm"))) return;

    setResolving(true);
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" as ReportStatus })
      .eq("id", report.id)
      .eq("owner_user_id", user.id)
      .eq("status", "active");

    setResolving(false);

    if (error) {
      window.alert(t("reportMarkResolvedFailed"));
      return;
    }

    track("report_resolved", {
      report_id: report.id,
    });

    setReport((prev) => ({
      ...prev,
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }));
    router.refresh();
  };

  const handleReopen = async () => {
    if (
      !reportIsOwner ||
      !user?.id ||
      reopening ||
      !canOwnerReopenReport(report.status, report.resolved_at)
    ) {
      return;
    }
    if (!window.confirm(t("reportReopenConfirm"))) return;

    setReopening(true);
    const ok = await reopenOwnerReport(report.id, user.id);
    setReopening(false);

    if (!ok) {
      window.alert(t("reportReopenFailed"));
      return;
    }

    setReport((prev) => ({ ...prev, status: "active", resolved_at: null }));
    router.refresh();
  };

  const reportedAt = formatReportTimestampDisplay(report);
  const description =
    report.description?.trim() || t("adminNoDescription");
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");

  const article = (
      <article className={`space-y-5 ${isSheet ? "" : "mx-auto max-w-lg"}`}>
        {isResolved ? (
          <div
            className="rounded-2xl border border-lp-teal/30 bg-lp-teal-soft px-4 py-3"
            role="status"
          >
            <p className="text-sm font-medium text-lp-teal">
              {t("reportResolved")}
            </p>
            <p className="mt-1 text-sm text-lp-ink-muted">
              {t("reportResolvedMessage")}
            </p>
          </div>
        ) : null}

        {report.photo_url && !photoBroken ? (
          <PopupPhoto
            src={report.photo_url}
            alt={
              report.animal_name?.trim() ||
              t(ANIMAL_LABEL_KEYS[report.animal_type])
            }
            layout="detail"
            hint={t("photoTapToEnlarge")}
            onError={() => setPhotoBroken(true)}
          />
        ) : (
          <div
            className="flex h-48 w-full items-center justify-center rounded-2xl border border-lp-line bg-lp-paper-muted text-sm text-lp-ink-subtle"
            aria-hidden
          >
            —
          </div>
        )}

        <header className="space-y-1">
          <h1
            id={isSheet ? "discover-detail-title" : undefined}
            className="text-2xl font-bold capitalize text-lp-ink"
          >
            {t(ANIMAL_LABEL_KEYS[report.animal_type])}
          </h1>
          <p className="text-base text-lp-ink">
            <span className="font-medium">{typeLabel}</span>
            {report.animal_name ? (
              <span className="text-lp-ink-muted">
                {" "}
                · {report.animal_name}
              </span>
            ) : null}
          </p>
        </header>

        {reportIsOwner ? (
          <section
            className="rounded-2xl border border-lp-sage/30 bg-lp-sage-soft px-4 py-3"
            aria-label={t("reportYouCreatedThis")}
          >
            <p className="text-sm font-medium text-lp-sage-dark">
              {t("reportYouCreatedThis")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {isActive ? (
                <button
                  type="button"
                  onClick={() => void handleMarkResolved()}
                  disabled={resolving}
                  className="rounded-full bg-lp-teal px-3 py-2 text-sm font-medium text-white hover:bg-lp-sage-dark disabled:opacity-60"
                >
                  {t("reportMarkResolved")}
                </button>
              ) : null}
              {canOwnerReopenReport(report.status, report.resolved_at) ? (
                <button
                  type="button"
                  onClick={() => void handleReopen()}
                  disabled={reopening}
                  className="rounded-full bg-lp-teal px-3 py-2 text-sm font-medium text-white hover:bg-lp-sage-dark disabled:opacity-60"
                >
                  {reopening ? t("reportReopening") : t("reportReopen")}
                </button>
              ) : null}
              {/* Sole in-app entry to /edit (mutation surface). */}
              <Link
                href={`/edit?id=${report.id}`}
                className="inline-block rounded-full bg-lp-ink px-3 py-2 text-sm text-white hover:bg-lp-ink-muted"
              >
                {t("reportEdit")}
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-full bg-lp-coral px-3 py-2 text-sm text-white hover:bg-lp-coral/80 disabled:opacity-60"
              >
                {t("reportDelete")}
              </button>
            </div>
          </section>
        ) : null}

        {!reportIsOwner ? (
          <div className="flex flex-wrap gap-2">
            <FlagReportButton
              reportId={report.id}
              className="rounded-full bg-lp-coral px-3 py-2 text-sm font-medium text-white hover:bg-lp-coral/80"
            />
          </div>
        ) : null}

        {reportedAt ? (
          <p className="text-sm text-lp-ink-subtle">
            <span className="text-lp-ink-subtle">{t("adminReported")}:</span>{" "}
            {reportedAt}
          </p>
        ) : null}

        <p className="text-sm text-lp-ink-subtle">
          <span className="text-lp-ink-subtle">{t("adminLocation")}:</span>{" "}
          <LocationDisplay
            latitude={report.latitude}
            longitude={report.longitude}
            onViewMap={
              isSheet
                ? undefined
                : () => router.push(`/?focus=${report.id}`)
            }
          />
        </p>

        <section>
          <h2 className="mb-2 text-sm font-medium text-lp-ink-subtle">
            {t("reportDescription")}
          </h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-lp-ink">
            {description}
          </p>
        </section>

        <p className="pt-2 text-xs text-lp-ink-subtle">
          {t("reportDetailId")}: {report.id}
        </p>
      </article>
  );

  if (isSheet) {
    return <div className="bg-lp-paper px-6 py-4 text-lp-ink">{article}</div>;
  }

  return (
    <main className="min-h-screen bg-lp-bg px-6 py-10 text-lp-ink">
      <div className="mx-auto mb-4 max-w-lg">
        <Link
          href={reportBackHref(from)}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm text-lp-ink-muted underline-offset-2 hover:text-lp-ink hover:underline"
        >
          <span aria-hidden>←</span>
          {t(backLabelKey(from))}
        </Link>
      </div>
      {article}
    </main>
  );
}
