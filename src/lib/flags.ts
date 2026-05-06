export async function flagReport(reportId: string, reason: string) {
  const res = await fetch(
    "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/flag-report",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId, reason }),
    }
  );

  const data = await res.json();

  if (!data.success) {
    console.error(data.error);
    return false;
  }

  return true;
}