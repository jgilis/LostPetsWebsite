export async function submitSighting(input: {
  lostReportId: string;
  latitude: number;
  longitude: number;
  description: string;
}): Promise<void> {
  const res = await fetch(
    "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/smooth-processor",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lost_report_id: input.lostReportId,
        latitude: input.latitude,
        longitude: input.longitude,
        description: input.description,
      }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to submit");
  }
}
