"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import LocationPicker from "./LocationPicker";
import { applyLocationOffset } from "../../lib/location";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";

interface ReportFormProps {
  onReportCreated?: () => void;
  onViewMap?: () => void;
}

export default function ReportForm({
    onReportCreated,
    onViewMap,
  }: ReportFormProps) {
  
  const [type, setType] = useState("");
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

  const lastSubmitKey = "last_submit_time";

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

    if (!description || description.trim().length < 5) {
      setMessage(t("reportErrorDescription"));
      setMessageType("error");
      return;
    }

    if (!latitude || !longitude) {
      setMessage(t("reportErrorLocation"));
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage(t("reportSubmitting"));
    setMessageType("info");

    try {
      let photo_url: string | null = null;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error } = await supabase.storage
          .from("report-photos")
          .upload(fileName, photo, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          setMessage(`${t("reportErrorPhoto")} ${error.message}`);
          setMessageType("error");
          return;
        }

        const { data } = supabase.storage
          .from("report-photos")
          .getPublicUrl(fileName);

        photo_url = data.publicUrl ?? null;
      }

      const { latitude: safeLat, longitude: safeLng } =
        applyLocationOffset(latitude, longitude);

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
        report: {
          type,
          animal_type: animalType,
          animal_name: animalName ?? "",
          description: description ?? "",
          latitude: safeLat,
          longitude: safeLng,
          contact_info: "",
          photo_url,
        },
      };

      const res = await fetch(
        "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/verify-captcha",
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

      setSubmittedReportId(result.report?.id ?? null);
      //setMessage("Report submitted successfully! Redirecting to map...");
      //setMessageType("success");

      // reset form safely
      setType("lost");
      setAnimalType("dog");
      setAnimalName("");
      setDescription("");
      setPhoto(null);
      setLatitude(51.0206);
      setLongitude(4.4756);
      setConsent(false);

    } catch (err) {
      setMessage(t("reportErrorGeneric"));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {!authLoading && !isLoggedIn && (
      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm">
        <p className="leading-relaxed text-gray-200">
          <span className="font-medium text-white">{t("reportLoginTitle")}</span>{" "}
          {t("reportLoginBody")}
        </p>
        <a
          href="/login"
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          {t("reportLoginCta")}
        </a>
      </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start bg-gray-900 text-white rounded-lg p-6 shadow-lg border border-gray-800">

        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-6 md:border-r md:border-gray-700 md:pr-8">

          {/* TYPE */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t("reportType")}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "lost" | "found" | "")}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
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
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
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
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              placeholder={t("reportAnimalNamePlaceholder")}
            />
          </label>

          {/* DESCRIPTION */}
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t("reportDescription")}</span>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 min-h-[120px] text-white"
              placeholder={t("reportDescriptionPlaceholder")}
            />
          </label>

          {/* PHOTO */}
          <div className="block space-y-2">
            <span className="block text-sm font-medium">{t("reportPhoto")}</span>
            
            <label className="inline-block">
              <span className="cursor-pointer inline-block bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded hover:bg-gray-700">
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
              <p className="text-xs text-gray-400">
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
            <p className="text-xs italic text-gray-400">
              {t("reportLocationPrivacy")}
            </p>
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
            className="w-full bg-white text-black py-2 rounded hover:opacity-90 disabled:opacity-50 font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("reportSubmitting") : t("reportSubmit")}
          </button>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-4 text-sm p-3 rounded border transition-all duration-300 animate-fade-in ${
                messageType === "success"
                  ? "bg-green-900/30 border-green-700 text-green-300"
                  : messageType === "error"
                  ? "bg-red-900/30 border-red-700 text-red-300"
                  : "bg-gray-800 border-gray-700 text-gray-300"
              }`}
            >
              <p>{message}</p>
              {showLoginCta && (
                <a
                  href="/login"
                  className="mt-3 inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {t("reportLoginLink")}
                </a>
              )}
            </div>
          )}

          {/* POST-SUBMIT SUCCESS */}
          {submittedReportId && (
            <div className="mt-6 p-4 rounded-lg border bg-green-900/20 border-green-600 text-green-200 space-y-3">
              
              <div>
                <p className="font-medium">✓ {t("reportSuccessTitle")}</p>
                <p className="text-sm text-green-300">
                  {t("reportSuccessBody")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={`/edit?id=${submittedReportId}`}
                  className="text-sm underline text-green-300 text-left"
                >
                  {t("reportManage")}
                </a>

                <button
                  type="button"
                  onClick={onViewMap}
                  className="text-sm underline text-green-300 hover:text-green-200 text-left"
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