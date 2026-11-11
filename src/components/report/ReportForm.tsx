"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import LocationPicker from "./LocationPicker";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { track } from "@/src/lib/analytics/analytics";
import { reportLoginHref, writeAuthReturnPath } from "../../lib/authRedirect";
import { reportTaskHref } from "../../lib/homeDestination";
import {
  blobToBase64,
  PhotoPreparationError,
  prepareReportPhoto,
} from "../../lib/prepareReportPhoto";
import {
  clearReportDraft,
  dataUrlToFile,
  readReportDraft,
  writeReportDraft,
} from "../../lib/reportDraft";
import {
  isAnimalType,
  isReportType,
  MIN_DESCRIPTION_LENGTH,
} from "../../lib/reportValidation";
import { fetchPossibleDuplicateReports } from "../../lib/duplicateHint";
import type { Report } from "../../lib/reports";

interface ReportFormProps {
  initialType?: "lost" | "found";
  onReportCreated?: () => void;
  onViewMap?: () => void;
}

export default function ReportForm({
    initialType,
    onReportCreated,
    onViewMap,
  }: ReportFormProps) {
  
  const [type, setType] = useState(initialType ?? "");
  const [animalType, setAnimalType] = useState("");
  
  const [animalName, setAnimalName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [latitude, setLatitude] = useState<number>(51.0206);
  const [longitude, setLongitude] = useState<number>(4.4756);

  const [photo, setPhoto] = useState<File | null>(null);

  const [consent, setConsent] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);
  const [showLoginCta, setShowLoginCta] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(
    null,
  );

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userId, loading: authLoading } = useCurrentUser();
  const { t } = useTranslation();
  const isLoggedIn = !!userId;
  const [draftReady, setDraftReady] = useState(false);
  const [duplicateHints, setDuplicateHints] = useState<Report[]>([]);

  useEffect(() => {
    if (!isAnimalType(animalType)) {
      setDuplicateHints([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchPossibleDuplicateReports({
        animalType,
        latitude,
        longitude,
      }).then((matches) => {
        if (!cancelled) setDuplicateHints(matches);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [animalType, latitude, longitude]);

  const lastSubmitKey = "last_submit_time";
  const loginTask = isReportType(type) ? type : (initialType ?? "lost");
  const loginHref = reportLoginHref(loginTask);

  useEffect(() => {
    const draft = readReportDraft();
    if (draft && (!initialType || draft.type === initialType)) {
      setType(draft.type);
      setAnimalType(draft.animalType);
      setAnimalName(draft.animalName);
      setDescription(draft.description);
      setLatitude(draft.latitude);
      setLongitude(draft.longitude);
      setConsent(draft.consent);
      if (draft.photoDataUrl) {
        const file = dataUrlToFile(draft.photoDataUrl, draft.photoName);
        if (file) setPhoto(file);
      }
    }
    setDraftReady(true);
  }, [initialType]);

  useEffect(() => {
    if (!draftReady) return;
    const draftType = isReportType(type) ? type : initialType;
    if (!draftType) return;

    void writeReportDraft({
      type: draftType,
      animalType,
      animalName,
      description,
      latitude,
      longitude,
      consent,
      photo,
    });
  }, [
    animalName,
    animalType,
    consent,
    description,
    draftReady,
    initialType,
    latitude,
    longitude,
    photo,
    type,
  ]);

  const persistDraftAndGoToLogin = async (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    const draftType = isReportType(type) ? type : (initialType ?? "lost");
    writeAuthReturnPath(reportTaskHref(draftType));
    await writeReportDraft({
      type: draftType,
      animalType,
      animalName,
      description,
      latitude,
      longitude,
      consent,
      photo,
    });
    window.location.assign(loginHref);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setShowLoginCta(false);

    if (!captchaToken) {
      setMessage(t("reportErrorCaptcha"));
      setMessageType("error");
      return;
    }

    const last = localStorage.getItem(lastSubmitKey);
    if (last) {
      const diff = Date.now() - Number(last);
      if (diff < 30000) {
        setMessage(t("reportErrorRateLimit"));
        setMessageType("error");
        return;
      }
    }

    if (!consent) {
      setMessage(t("reportErrorConsent"));
      setMessageType("error");
      return;
    }

    if (!isReportType(type)) {
      setMessage(t("reportErrorType"));
      setMessageType("error");
      return;
    }

    if (!isAnimalType(animalType)) {
      setMessage(t("reportErrorAnimalType"));
      setMessageType("error");
      return;
    }

    if (!description || description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setMessage(t("reportErrorDescription"));
      setMessageType("error");
      return;
    }

    if (!latitude || !longitude) {
      setMessage(t("reportErrorLocation"));
      setMessageType("error");
      return;
    }

    setSubmittedReportId(null);
    setIsSubmitting(true);
    setMessage(t("reportSubmitting"));
    setMessageType("info");

    try {
      let photoBase64: string | undefined;

      if (photo) {
        try {
          const prepared = await prepareReportPhoto(photo);
          photoBase64 = await blobToBase64(prepared);
        } catch (photoError) {
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

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        setMessage(t("reportErrorAuth"));
        setMessageType("error");
        setShowLoginCta(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setMessage(t("reportErrorAuth"));
        setMessageType("error");
        setShowLoginCta(true);
        return;
      }

      const payload = {
        token: captchaToken,
        contract: "v2",
        report: {
          type,
          animal_type: animalType,
          animal_name: animalName ?? "",
          description: description ?? "",
          latitude,
          longitude,
        },
        ...(photoBase64 ? { photo_base64: photoBase64 } : {}),
      };

      const res = await fetch(
        "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/verify-captcha-v2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        setMessage(t("reportErrorServer"));
        setMessageType("error");
        return;
      }

      // handle HTTP errors explicitly
      if (!res.ok) {
        const errorMsg = result?.error || t("reportErrorFailed");
        setMessage(errorMsg);
        setMessageType("error");
        if (
          res.status === 401 ||
          /authentication required|not authorized|access not authorized/i.test(
            errorMsg,
          )
        ) {
          setShowLoginCta(true);
        }
        return;
      }

      if (!result.success) {
        setMessage(result.error || t("reportErrorSubmission"));
        setMessageType("error");
        return;
      }

      localStorage.setItem(lastSubmitKey, Date.now().toString());
      clearReportDraft();

      track("report_created", {
        animal_type: animalType,
      });

      const createdId =
        typeof result.report?.id === "string" ? result.report.id : null;
      setSubmittedReportId(createdId);
      if (createdId) {
        setMessage(null);
        setMessageType(null);
      } else {
        setMessage(t("reportSuccessTitle"));
        setMessageType("success");
      }
      onReportCreated?.();

      // reset form safely
      setType(initialType ?? "lost");
      setAnimalType("dog");
      setAnimalName("");
      setDescription("");
      setPhoto(null);
      setLatitude(51.0206);
      setLongitude(4.4756);
      setConsent(false);

    } catch {
      setMessage(t("reportErrorGeneric"));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {!authLoading && !isLoggedIn && (
      <div className="mb-6 rounded-2xl border border-lp-line bg-lp-paper px-4 py-3 text-sm">
        <p className="leading-relaxed text-lp-ink-muted">
          <span className="font-medium text-lp-ink">{t("reportLoginTitle")}</span>{" "}
          {t("reportLoginBody")}
        </p>
        <a
          href={loginHref}
          onClick={(event) => void persistDraftAndGoToLogin(event)}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-lp-sage px-4 py-2 text-sm font-semibold text-white hover:bg-lp-sage-dark"
        >
          {t("reportLoginCta")}
        </a>
      </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start bg-lp-paper text-lp-ink rounded-2xl p-6 shadow-[0_10px_28px_rgb(61_52_44_/_0.08)] border border-lp-line">

        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-6 md:border-r md:border-lp-line md:pr-8">

          {/* TYPE */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t("reportType")}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "lost" | "found" | "")}
              className="w-full bg-lp-paper-muted border border-lp-line rounded-xl p-2 text-lp-ink"
            >
              <option value="" disabled>
                {t("reportSelectStatus")}
              </option>

              <option value="lost">{t("reportLost")}</option>
              <option value="found">{t("reportFound")}</option>
            </select>
          </label>

          {/* ANIMAL TYPE */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t("reportAnimalType")}</span>
            <select
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value)}
              className="w-full bg-lp-paper-muted border border-lp-line rounded-xl p-2 text-lp-ink"
            >
              <option value="" disabled>
                {t("reportSelectAnimal")}
              </option>

              <option value="dog">{t("animalDog")}</option>
              <option value="cat">{t("animalCat")}</option>
              <option value="bird">{t("animalBird")}</option>
              <option value="rodent">{t("animalRodent")}</option>
              <option value="other">{t("animalOther")}</option>
            </select>
          </label>

          {/* ANIMAL NAME */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t("reportAnimalName")}
            </span>
            <input
              value={animalName ?? ""}
              onChange={(e) => setAnimalName(e.target.value)}
              className="w-full bg-lp-paper-muted border border-lp-line rounded-xl p-2 text-lp-ink"
              placeholder={t("reportAnimalNamePlaceholder")}
            />
          </label>

          {/* DESCRIPTION */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t("reportDescription")}</span>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-lp-paper-muted border border-lp-line rounded-xl p-2 min-h-[120px] text-lp-ink"
              placeholder={t("reportDescriptionPlaceholder")}
            />
          </label>

          {/* PHOTO */}
          <div className="block space-y-2">
            <span className="block text-sm font-medium">{t("reportPhoto")}</span>
            
            <label className="inline-block">
              <span className="cursor-pointer inline-block bg-lp-sage-soft border border-lp-line text-lp-sage-dark px-4 py-2 rounded-full hover:bg-lp-sage/20">
                {t("reportChoosePhoto")}
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            {photo && (
              <p className="text-xs text-lp-ink-subtle">
                {t("reportPhotoSelected")} {photo.name}
              </p>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-6 md:pl-8">

          {/* LOCATION */}
          <div className="w-full overflow-hidden rounded">
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />
            <p className="text-xs italic text-lp-ink-subtle">
              {t("reportLocationPrivacy")}
            </p>
            {duplicateHints.length > 0 ? (
              <div className="mt-3 rounded-xl border border-lp-gold/70 bg-lp-gold-soft px-3 py-2 text-sm text-lp-ink">
                <p>{t("reportDuplicateHint")}</p>
                <ul className="mt-1 list-inside list-disc text-lp-ink-muted">
                  {duplicateHints.slice(0, 3).map((match) => (
                    <li key={match.id}>
                      {match.animal_type}
                      {match.animal_name ? ` (${match.animal_name})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-lp-ink-subtle">
                  {t("reportDuplicateHintContinue")}
                </p>
              </div>
            ) : null}
          </div>

          {/* CAPTCHA */}
          <div className="pt-2">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>

          {/* CONSENT */}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={() => setConsent(!consent)}
              className="mt-1"
            />
            <span>{t("reportConsent")}</span>
          </label>

          {/* SUBMIT */}
          <button
            type="submit"
            className="w-full bg-lp-sage text-white py-2 rounded-full hover:bg-lp-sage-dark disabled:opacity-50 font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("reportSubmitting") : t("reportSubmit")}
          </button>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-4 text-sm p-3 rounded border transition-all duration-300 animate-fade-in ${
                messageType === "success"
                  ? "bg-lp-teal-soft border-lp-teal text-lp-teal"
                  : messageType === "error"
                  ? "bg-lp-coral-soft border-lp-coral text-lp-coral"
                  : "bg-lp-paper-muted border-lp-line text-lp-ink"
              }`}
            >
              <p>{message}</p>
              {showLoginCta && (
                <a
                  href={loginHref}
                  onClick={(event) => void persistDraftAndGoToLogin(event)}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-lp-sage px-4 py-2 text-sm font-semibold text-white hover:bg-lp-sage-dark"
                >
                  {t("reportLoginLink")}
                </a>
              )}
            </div>
          )}

          {/* POST-SUBMIT SUCCESS */}
          {submittedReportId && (
            <div className="mt-6 p-4 rounded-2xl border bg-lp-teal-soft border-lp-teal text-lp-ink space-y-3">
              
              <div>
                <p className="font-medium">✓ {t("reportSuccessTitle")}</p>
                <p className="text-sm text-lp-ink-muted">
                  {t("reportSuccessBody")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={`/edit?id=${submittedReportId}`}
                  className="text-sm underline text-lp-teal text-left"
                >
                  {t("reportManage")}
                </a>

                <button
                  type="button"
                  onClick={onViewMap}
                  className="text-sm underline text-lp-teal hover:text-lp-sage-dark text-left"
                >
                  → {t("reportViewMap")}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  );
}