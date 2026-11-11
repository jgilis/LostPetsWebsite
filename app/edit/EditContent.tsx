"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../src/hooks/useCurrentUser";
import { isOwner } from "../../src/lib/permissions";
import LocationPicker from "../../src/components/report/LocationPicker";
import {
  canOwnerEditPhotoAndPin,
  canOwnerEditReportDetails,
  canOwnerReopenReport,
  getOwnerReportById,
  reopenOwnerReport,
  updateOwnerReportDetails,
  type Report,
} from "../../src/lib/reports";
import { supabase } from "../../src/lib/supabase";
import { useTranslation } from "@/src/i18n/I18nProvider";
import {
  blobToBase64,
  PhotoPreparationError,
  prepareReportPhoto,
} from "../../src/lib/prepareReportPhoto";
import {
  MAX_ANIMAL_NAME_LENGTH,
  MIN_DESCRIPTION_LENGTH,
} from "../../src/lib/reportValidation";

export default function EditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("id");
  const { userId, loading: authLoading } = useCurrentUser();
  const { t } = useTranslation();

  const [report, setReport] = useState<Report | null>(null);
  const [animalName, setAnimalName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(51.0206);
  const [longitude, setLongitude] = useState(4.4756);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setLoading(false);
      return;
    }

    if (!reportId) {
      setLoading(false);
      setMessage(t("reportEditMissingId"));
      setMessageType("error");
      return;
    }

    let active = true;

    const fetchReport = async () => {
      const data = await getOwnerReportById(reportId, userId);
      if (!active) return;

      if (!data || !isOwner(userId, data.owner_user_id)) {
        setMessage(t("reportEditNotFound"));
        setMessageType("error");
        setReport(null);
      } else {
        setReport(data);
        setAnimalName(data.animal_name ?? "");
        setDescription(data.description ?? "");
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setPhoto(null);
        setMessage("");
        setMessageType("");
      }

      setLoading(false);
    };

    void fetchReport();

    return () => {
      active = false;
    };
  }, [authLoading, userId, reportId, t]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !userId || saving || !canOwnerEditReportDetails(report.status)) {
      return;
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setMessage(t("reportErrorDescription"));
      setMessageType("error");
      return;
    }

    const canMovePin = canOwnerEditPhotoAndPin(report.status);
    const pinChanged =
      canMovePin &&
      (latitude !== report.latitude || longitude !== report.longitude);

    setSaving(true);
    let photoBase64: string | undefined;
    if (canMovePin && photo) {
      try {
        const prepared = await prepareReportPhoto(photo);
        photoBase64 = await blobToBase64(prepared);
      } catch (photoError) {
        setSaving(false);
        const code =
          photoError instanceof PhotoPreparationError
            ? photoError.code
            : "invalid-type";
        setMessage(
          code === "too-large"
            ? t("reportErrorPhotoTooLarge")
            : t("reportErrorPhotoInvalid"),
        );
        setMessageType("error");
        return;
      }
    }

    const result = await updateOwnerReportDetails(report.id, userId, {
      description,
      animal_name: animalName,
      ...(pinChanged ? { latitude, longitude } : {}),
      ...(photoBase64 ? { photoBase64 } : {}),
    });
    setSaving(false);

    if (!result.ok) {
      setMessage(t("reportEditSaveFailed"));
      setMessageType("error");
      return;
    }

    setReport((prev) =>
      prev
        ? {
            ...prev,
            description: description.trim(),
            animal_name: animalName.trim(),
            latitude: result.report?.latitude ?? prev.latitude,
            longitude: result.report?.longitude ?? prev.longitude,
            photo_url: result.report?.photo_url ?? prev.photo_url,
          }
        : prev,
    );
    if (result.report) {
      setLatitude(result.report.latitude);
      setLongitude(result.report.longitude);
    }
    setPhoto(null);
    setMessage(t("reportEditSaved"));
    setMessageType("success");
  };

  const handleDelete = async () => {
    if (!report || !userId || !isOwner(userId, report.owner_user_id) || deleting) {
      return;
    }

    if (!window.confirm(t("reportDeleteConfirm"))) return;

    setDeleting(true);
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", report.id)
      .eq("owner_user_id", userId);
    setDeleting(false);

    if (error) {
      setMessage(t("reportDeleteFailed"));
      setMessageType("error");
      return;
    }

    router.push("/");
  };

  const handleReopen = async () => {
    if (
      !report ||
      !userId ||
      reopening ||
      !canOwnerReopenReport(report.status, report.resolved_at)
    ) {
      return;
    }

    if (!window.confirm(t("reportReopenConfirm"))) return;

    setReopening(true);
    const ok = await reopenOwnerReport(report.id, userId);
    setReopening(false);

    if (!ok) {
      setMessage(t("reportReopenFailed"));
      setMessageType("error");
      return;
    }

    setReport((prev) =>
      prev ? { ...prev, status: "active", resolved_at: null } : prev,
    );
    setMessage(t("reportReopened"));
    setMessageType("success");
  };

  if (authLoading || loading) {
    return (
      <p className="px-6 py-10 text-lp-ink-muted">{t("reportDetailLoading")}</p>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10 text-lp-ink">
        <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
        <p className="mt-3 text-lp-ink">{t("reportEditLogin")}</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-lp-sage px-4 py-2 text-sm font-semibold text-white hover:bg-lp-sage-dark"
        >
          {t("reportLoginLink")}
        </Link>
      </div>
    );
  }

  if (!reportId || !report) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10 text-lp-ink">
        <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
        <p className="mt-3 text-lp-ink">
          {message || t("reportEditNotFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 text-lp-ink">
      <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
      <p className="mt-2 text-sm text-lp-ink-muted">{t("reportEditHint")}</p>

      {canOwnerEditReportDetails(report.status) ? (
      <form onSubmit={(e) => void handleSave(e)} className="mt-6 space-y-4">
        <p className="text-sm text-lp-ink-muted">
          <span className="text-lp-ink-subtle">{t("reportType")}:</span>{" "}
          {report.type === "lost" ? t("reportLost") : t("reportFound")}
          <span className="mx-2 text-gray-700">·</span>
          <span className="text-lp-ink-subtle">{t("reportAnimalType")}:</span>{" "}
          {report.animal_type}
        </p>
        <p className="text-xs text-lp-ink-subtle">{t("reportEditTypeReadonly")}</p>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t("reportAnimalName")}
          </span>
          <input
            value={animalName}
            maxLength={MAX_ANIMAL_NAME_LENGTH}
            onChange={(e) => setAnimalName(e.target.value)}
            className="w-full rounded-xl border border-lp-line bg-lp-paper p-2 text-lp-ink"
            placeholder={t("reportAnimalNamePlaceholder")}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t("reportDescription")}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-lp-line bg-lp-paper p-2 text-lp-ink"
            placeholder={t("reportDescriptionPlaceholder")}
          />
        </label>

        {canOwnerEditPhotoAndPin(report.status) ? (
          <>
            <div className="block space-y-2">
              <span className="mb-1 block text-sm font-medium">
                {t("reportPhoto")}
              </span>
              {report.photo_url ? (
                <img
                  src={report.photo_url}
                  alt=""
                  className="max-h-40 rounded border border-gray-700 object-cover"
                />
              ) : null}
              <label className="inline-block">
                <span className="inline-block cursor-pointer rounded-full border border-lp-line bg-lp-sage-soft px-4 py-2 text-lp-sage-dark hover:bg-lp-sage/20">
                  {t("reportChoosePhoto")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {photo ? (
                <p className="text-xs text-lp-ink-muted">
                  {t("reportPhotoSelected")} {photo.name}
                </p>
              ) : null}
            </div>

            <div className="w-full overflow-hidden rounded">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
              />
              <p className="text-xs italic text-lp-ink-muted">
                {t("reportLocationPrivacy")}
              </p>
            </div>
          </>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("reportEditSaving") : t("reportEditSave")}
        </button>
      </form>
      ) : (
        <p className="mt-6 text-sm text-lp-ink-muted">{t("reportEditUnavailable")}</p>
      )}

      {canOwnerReopenReport(report.status, report.resolved_at) ? (
        <div className="mt-10 border-t border-gray-800 pt-6">
          <p className="text-sm text-lp-ink-muted">{t("reportReopenHint")}</p>
          <button
            type="button"
            onClick={() => void handleReopen()}
            disabled={reopening}
            className="mt-3 rounded-full bg-lp-teal px-4 py-2 text-sm font-medium text-white hover:bg-lp-sage-dark disabled:opacity-50"
          >
            {reopening ? t("reportReopening") : t("reportReopen")}
          </button>
        </div>
      ) : null}

      <div className="mt-10 border-t border-gray-800 pt-6">
        <p className="text-sm text-lp-ink-muted">{t("reportDeletePermanentHint")}</p>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="mt-3 rounded-full bg-lp-coral px-4 py-2 text-sm text-white hover:bg-lp-coral/80 disabled:opacity-50"
        >
          {deleting ? t("reportSubmitting") : t("reportDelete")}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-4 text-sm ${
            messageType === "success" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
