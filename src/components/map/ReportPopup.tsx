"use client";

import { useState, useEffect } from "react";
import type { Report } from "../report/useReports";
import { flagReport } from "../../lib/flags";
import SightingModal from "../sightings/SightingsModal";
import {
  getApprovedSightings,
  Sighting,
} from "../../lib/sightings";

type Props = {
  report: Report;

  // TEMP
  // later replace with real auth/permissions
  canSeeExactSightings?: boolean;
};

export default function ReportPopup({
  report,
  canSeeExactSightings = false,
}: Props) {
  const [showSightingModal, setShowSightingModal] =
    useState(false);

  const [sightings, setSightings] = useState<Sighting[]>(
    []
  );

  useEffect(() => {
    async function loadSightings() {
      if (report.type !== "lost") return;

      const data = await getApprovedSightings(report.id);

      setSightings(data);
    }

    loadSightings();
  }, [report.id, report.type]);

  return (
    <div style={{ maxWidth: "200px" }}>
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
          <img
            src={report.photo_url}
            alt={report.animal_type}
            style={{
              width: "100%",
              borderRadius: "6px",
              marginTop: "4px",
            }}
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
        {/* CONTACT */}
        <div style={{ wordBreak: "break-word" }}>
          Contact: {report.contact_info}
        </div>

        {/* SIGHTING BUTTON */}
        {report.type === "lost" && (
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
    </div>
  );
}