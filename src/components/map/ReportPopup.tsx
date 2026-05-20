"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { reportDetailHref } from "@/src/lib/reportNavigation";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import { useRealtimeResyncRegister } from "../sync/RealtimeResyncProvider";
import type { Report } from "../report/useReports";
import { flagReport } from "../../lib/flags";
import SightingModal from "../sightings/SightingsModal";
import {
  getApprovedSightings,
  Sighting,
} from "../../lib/sightings";
import PopupPhoto from "./PopupPhoto";

type Props = {
  report: Report;
  canSeeExactSightings?: boolean;
  isReportOwner?: boolean;
};

export default function ReportPopup({
  report,
  canSeeExactSightings = false,
  isReportOwner = false,
}: Props) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const isOwner =
    !!user?.id &&
    !!report.owner_user_id &&
    user.id === report.owner_user_id;
  const [showSightingModal, setShowSightingModal] =
    useState(false);

  const [sightings, setSightings] = useState<Sighting[]>(
    []
  );

  const loadSightings = useCallback(async () => {
    if (report.type !== "lost") {
      setSightings([]);
      return;
    }

    const data = await getApprovedSightings(report.id);
    setSightings(data);
  }, [report.id, report.type]);

  useEffect(() => {
    void loadSightings();
  }, [loadSightings]);

  useVisibilitySyncRegister(() => {
    void loadSightings();
  }, [loadSightings]);

  useRealtimeResyncRegister(() => {
    void loadSightings();
  }, [loadSightings]);

  return (
    <div
      className="report-popup-body"
      onWheel={(e) => e.stopPropagation()}
    >
      {isOwner ? (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#047857",
          }}
        >
          <span aria-hidden>✓ </span>
          {t("reportYouReportedThis")}
        </p>
      ) : null}

      <strong>{report.type}</strong> {report.animal_type}
      <br />

      {report.animal_name && (
        <>
          Name: {report.animal_name}
          <br />
        </>
      )}

      {report.description && (
        <em>{report.description}</em>
      )}

      <br />

      {report.photo_url && (
        <div style={{ marginTop: "8px" }}>
          <PopupPhoto
            src={report.photo_url}
            alt={report.animal_type}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "6px",
          marginTop: "8px",
        }}
      >
        {/* SIGHTING BUTTON */}
        {report.type === "lost" && !isOwner && (
          <button
            onClick={() =>
              setShowSightingModal(true)
            }
            style={{
              padding: "6px 10px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            I spotted this animal
          </button>
        )}

        {/* REPORT BUTTON */}
        {!isOwner && (
        <button
          onClick={async () => {
            const reason = prompt(
              "Why are you reporting this post?"
            );

            if (!reason) return;

            const ok = await flagReport(
              report.id,
              reason
            );

            if (ok) {
              alert(
                "Report submitted. Thank you."
              );
            } else {
              alert(
                "Failed to submit report."
              );
            }
          }}
          style={{
            padding: "6px 10px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Report this post
        </button>
        )}
      </div>

      {/* MODAL */}
      {showSightingModal && (
        <SightingModal
          lostReportId={report.id}
          onClose={() =>
            setShowSightingModal(false)
          }
        />
      )}

      {/* SIGHTINGS */}
      {sightings.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            borderTop: "1px solid #ddd",
            paddingTop: "10px",
          }}
        >
          {canSeeExactSightings ? (
            <>
              <strong>Recent sightings</strong>

              {sightings.map((s) => (
                <div
                  key={s.id}
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    background: "#f9fafb",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    📍{" "}
                    {s.latitude.toFixed(4)},{" "}
                    {s.longitude.toFixed(4)}
                  </div>

                  {s.description && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                      }}
                    >
                      📝 {s.description}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "11px",
                      color: "#666",
                    }}
                  >
                    {new Date(
                      s.created_at
                    ).toLocaleString()}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div
              style={{
                marginTop: "8px",
                padding: "10px",
                background: "#fef3c7",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              👀 This animal has recently been
              sighted nearby.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          paddingTop: "8px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Link
          href={reportDetailHref(report.id, "map")}
          style={{
            display: "inline-block",
            padding: "4px 0",
            fontSize: "13px",
            color: "#6b7280",
            textDecoration: "underline",
          }}
        >
          {t("reportViewFull")}
        </Link>
      </div>
    </div>
  );
}