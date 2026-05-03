import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Report {
  id: string;
  type: "lost" | "found";
  animal_type: "dog" | "cat" | "bird" | "rodent" | "other";
  animal_name?: string | null;
  description?: string;
  latitude: number;
  longitude: number;
  contact_info: string;
  photo_url?: string | null;
  status: "active" | "resolved" | "expired";
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        type,
        animal_type,
        animal_name,
        description,
        latitude,
        longitude,
        contact_info,
        photo_url,
        status,
        expires_at
      `);

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    const now = new Date();

    const cleaned: Report[] = (data ?? []).map((r) => {
      const expiresAt = r.expires_at ? new Date(r.expires_at) : null;

      let status = r.status ?? "active";

      // 🧠 auto-expire logic
      if (status === "active" && expiresAt && expiresAt < now) {
        status = "expired";
      }

      return {
        id: r.id,
        type: r.type,
        animal_type: r.animal_type,
        animal_name: r.animal_name,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        contact_info: r.contact_info,
        photo_url: r.photo_url,
        status,
      };
    });

    // only active shown on map
    setReports(cleaned.filter((r) => r.status === "active"));

    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("reports-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        fetchReports
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { reports, loading };
}