"use client";

import { useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import LocationPicker from "../report/LocationPicker";
import { isOutOfMechelen } from "../../lib/mechelenBounds";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import { track } from "@/src/lib/analytics/analytics";
import { submitSighting } from "@/src/lib/submitSighting";
import {
  parseObservedAt,
  toDatetimeLocalValue,
} from "@/src/lib/sightingObservation";
import {
  blobToBase64,
  PhotoPreparationError,
  prepareReportPhoto,
} from "@/src/lib/prepareReportPhoto";
import { useTranslation } from "@/src/i18n/I18nProvider";

type Props = {
  lostReportId: string;
  onClose: () => void;
};

export default function SightingModal({ lostReportId, onClose }: Props) {
  const { t } = useTranslation();
  const defaultWhen = useMemo(() => toDatetimeLocalValue(new Date()), []);
  const [description, setDescription] = useState("");
  const [observedAt, setObservedAt] = useState(defaultWhen);
  const [photo, setPhoto] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"gps" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isValid = !!lat && !!lng && !loading;
  const outOfArea =
    lat != null && lng != null && isOutOfMechelen(lat, lng);
  const observedMax = toDatetimeLocalValue(new Date());

  const useGPS = () => {
    setMode("gps");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        setError(t("sightingGpsFailed"));
        setMode(null);
      }
    );
  };

  const submit = async () => {
    if (!lat || !lng) {
      setError(t("sightingNeedLocation"));
      return;
    }

    const when = parseObservedAt(observedAt);
    if (!when) {
      setError(t("sightingErrorWhen"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoBase64: string | undefined;
      if (photo) {
        const prepared = await prepareReportPhoto(photo);
        photoBase64 = await blobToBase64(prepared);
      }

      await submitSighting({
        lostReportId,
        latitude: lat,
        longitude: lng,
        description,
        observedAt: when.toISOString(),
        photoBase64,
      });

      track("sighting_created", {
        report_id: lostReportId,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof PhotoPreparationError) {
        setError(
          err.code === "too-large"
            ? t("reportErrorPhotoTooLarge")
            : t("reportErrorPhotoInvalid"),
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("reportErrorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "95%",
          maxWidth: "720px",
          minWidth: "320px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#111827",
        }}
      >
        {submitted ? (
          <>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "12px",
                letterSpacing: "-0.2px",
              }}
            >
              {t("sightingPendingTitle")}
            </h2>
            <p style={{ marginBottom: "16px", lineHeight: 1.5 }}>
              {t("sightingPendingBody")}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {t("sightingClose")}
            </button>
          </>
        ) : (
          <>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "12px",
                letterSpacing: "-0.2px",
              }}
            >
              {t("sightingTitle")}
            </h2>

            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={useGPS}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                {t("sightingUseLocation")}
              </button>

              <button
                type="button"
                onClick={() => setMode("manual")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                {t("sightingPickMap")}
              </button>
            </div>

            {mode === "manual" && (
              <div style={{ marginTop: "10px" }}>
                <LocationPicker
                  latitude={lat ?? 51.025}
                  longitude={lng ?? 4.477}
                  setLatitude={setLat}
                  setLongitude={setLng}
                />
              </div>
            )}

            {lat && lng && (
              <p>
                📍 <LocationDisplay latitude={lat} longitude={lng} />
              </p>
            )}

            {outOfArea && (
              <p
                style={{
                  color: "#b45309",
                  fontSize: "14px",
                  marginTop: "8px",
                  marginBottom: 0,
                }}
              >
                {t("sightingOutOfArea")}
              </p>
            )}

            <label style={{ display: "block", marginTop: "12px" }}>
              <span style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                {t("sightingWhen")}
              </span>
              <input
                type="datetime-local"
                value={observedAt}
                max={observedMax}
                onChange={(e) => setObservedAt(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>

            <textarea
              placeholder={t("sightingWhatDidYouSee")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginTop: "10px" }}
            />

            <div style={{ marginTop: "10px" }}>
              <span style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                {t("sightingPhoto")}
              </span>
              <label style={{ display: "inline-block" }}>
                <span
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    background: "#f3f4f6",
                    border: "1px solid #ddd",
                    padding: "8px 12px",
                    borderRadius: "8px",
                  }}
                >
                  {t("reportChoosePhoto")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </label>
              {photo ? (
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                  {t("reportPhotoSelected")} {photo.name}
                </p>
              ) : null}
            </div>

            {error && (
              <p style={{ color: "red" }}>{error}</p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "16px",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#f3f4f6",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {t("sightingCancel")}
              </button>

              <button
                type="button"
                onClick={() => void submit()}
                disabled={!isValid}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: !isValid ? "#9ca3af" : "#2563eb",
                  color: "white",
                  cursor: !isValid ? "not-allowed" : "pointer",
                  flex: 1,
                }}
              >
                {loading ? t("sightingSubmitting") : t("sightingSubmit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
