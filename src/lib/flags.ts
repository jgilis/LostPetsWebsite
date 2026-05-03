import { supabase } from "../lib/supabase";

export async function flagReport(reportId: string, reason: string) {
  const { error } = await supabase.from("reports_flags").insert([
    {
      report_id: reportId,
      reason,
    },
  ]);

  if (error) {
    console.error("Flag error:", error.message);
    return false;
  }

  return true;
}