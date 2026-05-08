"use client";

import type { Report } from "../report/useReports";
import { flagReport } from "../../lib/flags";

type Props = {
  report: Report;
};

export default function ReportPopup({ report }: Props) {
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

      {report.description && <em>{report.description}</em>}
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
        }}
      >
        {/* CONTACT */}
        <div style={{ wordBreak: "break-word" }}>
          Contact: {report.contact_info}
        </div>

        {/* REPORT BUTTON */}
        <button
          onClick={async () => {
            const reason = prompt("Why are you reporting this post?");
            if (!reason) return;

            const ok = await flagReport(report.id, reason);

            if (ok) {
              alert("Report submitted. Thank you.");
            } else {
              alert("Failed to submit report.");
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
    </div>
  );
}