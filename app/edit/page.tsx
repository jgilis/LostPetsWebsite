"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";

export default function EditPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [report, setReport] = useState<any>(null);
  const [message, setMessage] = useState("");

  // Only fetch data in the client (browser)
  useEffect(() => {
    // Make sure the token exists before running the API call
    if (!token) {
      setMessage("Invalid link.");
      return; // Early return if there's no token
    }

    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("edit_token", token)
        .single();

      if (error) {
        setMessage("Report not found.");
      } else {
        setReport(data);
      }
    };

    fetchReport();
  }, [token]);

  const handleDelete = async () => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("edit_token", token);

    if (error) {
      setMessage("Delete failed.");
    } else {
      setMessage("Report deleted.");
    }
  };

  // Early returns to handle UI when token is invalid or loading the report
  if (!token) return <p>Invalid link.</p>;
  if (!report) return <p>Loading...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Edit / Delete Report</h1>

      <p><strong>Type:</strong> {report.type}</p>
      <p><strong>Animal:</strong> {report.animal_type}</p>
      <p><strong>Description:</strong> {report.description}</p>

      <button onClick={handleDelete} style={{ marginTop: "10px" }}>
        Delete Report
      </button>

      <p>{message}</p>
    </div>
  );
}