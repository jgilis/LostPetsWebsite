"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function AdminAllReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("reports")
      .select("*")
      .order("date_reported", { ascending: false })
      .then(({ data }) => setReports(data || []));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📋 All Reports</h1>

      {reports.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          <p><b>{r.animal_type}</b> — {r.status}</p>
          <p>{r.description}</p>
        </div>
      ))}
    </div>
  );
}