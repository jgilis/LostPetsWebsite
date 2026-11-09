"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../src/hooks/useCurrentUser";
import { isOwner } from "../../src/lib/permissions";
import {
  canOwnerEditReportDetails,
  getOwnerReportById,
  updateOwnerReportDetails,
  type Report,
} from "../../src/lib/reports";
import { supabase } from "../../src/lib/supabase";
import { useTranslation } from "@/src/i18n/I18nProvider";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    const ok = await updateOwnerReportDetails(report.id, userId, {
      description,
      animal_name: animalName,
    });
    setSaving(false);

    if (!ok) {
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
          }
        : prev,
    );
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

  if (authLoading || loading) {
    return (
      <p className="px-6 py-10 text-gray-400">{t("reportDetailLoading")}</p>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10 text-white">
        <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
        <p className="mt-3 text-gray-300">{t("reportEditLogin")}</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          {t("reportLoginLink")}
        </Link>
      </div>
    );
  }

  if (!reportId || !report) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10 text-white">
        <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
        <p className="mt-3 text-gray-300">
          {message || t("reportEditNotFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 text-white">
      <h1 className="text-2xl font-bold">{t("reportEditTitle")}</h1>
      <p className="mt-2 text-sm text-gray-400">{t("reportEditHint")}</p>

      {canOwnerEditReportDetails(report.status) ? (
      <form onSubmit={(e) => void handleSave(e)} className="mt-6 space-y-4">
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">{t("reportType")}:</span>{" "}
          {report.type === "lost" ? t("reportLost") : t("reportFound")}
          <span className="mx-2 text-gray-700">·</span>
          <span className="text-gray-500">{t("reportAnimalType")}:</span>{" "}
          {report.animal_type}
        </p>
        <p className="text-xs text-gray-500">{t("reportEditTypeReadonly")}</p>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t("reportAnimalName")}
          </span>
          <input
            value={animalName}
            maxLength={MAX_ANIMAL_NAME_LENGTH}
            onChange={(e) => setAnimalName(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-800 p-2 text-white"
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
            className="min-h-[120px] w-full rounded border border-gray-700 bg-gray-800 p-2 text-white"
            placeholder={t("reportDescriptionPlaceholder")}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("reportEditSaving") : t("reportEditSave")}
        </button>
      </form>
      ) : (
        <p className="mt-6 text-sm text-gray-400">{t("reportEditUnavailable")}</p>
      )}

      <div className="mt-10 border-t border-gray-800 pt-6">
        <p className="text-sm text-gray-400">{t("reportDeletePermanentHint")}</p>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="mt-3 rounded-md bg-red-900/80 px-4 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-50"
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
