"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";

type Report = {
  id: string;
  type: string;
  animal_type: string;
  description: string;
  edit_token: string;
};

export default function EditPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

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