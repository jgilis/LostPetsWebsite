// Add this at the top of your file
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

type EditPageProps = {
  reportData: Report | null;
};

export default function EditPage({ reportData }: EditPageProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [report, setReport] = useState<Report | null>(reportData);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || report) return;

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
  }, [token, report]);

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

export async function getServerSideProps({ params }: { params: { token: string } }) {
  const { token } = params;
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("edit_token", token)
    .single();

  if (error) {
    return { props: { reportData: null } };
  }

  return { props: { reportData: data } };
}