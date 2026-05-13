"use client";

import { useEffect, useState } from "react";
import { getAllReports } from "../../../src/lib/reports";

export default function AdminAllReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllReports();
        setReports(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📋 All Reports</h1>

      {reports.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <p>
            <b>{r.animal_type}</b> — {r.status}
          </p>
          <p>{r.description}</p>
        </div>
      ))}
    </div>
  );
}