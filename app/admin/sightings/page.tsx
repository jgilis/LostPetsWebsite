"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import { getAdminSightings, updateSightingStatus } from "../../../src/lib/sightings";

type ReportRef = {
  id: string;
  latitude: number;
  longitude: number;
  animal_type: string;
  animal_name: string | null;
  owner_user_id: string | null;
};

type Sighting = {
  id: string;
  lost_report_id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  reports?: ReportRef | null;
};

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const statusLabel: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  removed: "Removed",
};

const statusClass: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
  removed: "text-gray-500",
};

export default function AdminSightingsPage() {
  const { loading: adminLoading, isAdmin } = useAdmin();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getAdminSightings();
      setSightings(data as Sighting[]);
      setLoading(false);
    }

    void load();
  }, []);

  async function updateStatus(
    id: string,
    status: "approved" | "rejected" | "removed" | "pending"
  ) {
    const result = await updateSightingStatus(id, status);

    if (!result) {
      alert("Failed to update status");
      return;
    }

    setSightings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }

  if (adminLoading) {
    return <p className="p-8 text-gray-400">Checking access...</p>;
  }

  if (!isAdmin) return null;

  if (loading) {
    return <p className="p-8 text-gray-400">Loading sightings...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title="All Sightings" showBackLink />

      {sightings.length === 0 && (
        <p className="text-gray-400">No sightings yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {sightings.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-200"
          >
            <p className="text-sm text-gray-400">
              {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
            </p>

            {s.reports && (
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  {s.reports.animal_type}
                  {s.reports.animal_name ? ` (${s.reports.animal_name})` : ""}
                </p>
                <p className="text-gray-400">
                  Distance from last known location:{" "}
                  {getDistanceMeters(
                    s.reports.latitude,
                    s.reports.longitude,
                    s.latitude,
                    s.longitude
                  ).toFixed(0)}
                  m
                </p>
              </div>
            )}

            <p className="mt-2">{s.description || "No description"}</p>

            <p
              className={`mt-2 text-xs font-semibold ${statusClass[s.status] ?? "text-gray-400"}`}
            >
              {statusLabel[s.status] ?? s.status}
            </p>

            <div className="mt-3 flex flex-col gap-1 border-t border-gray-800 pt-3 text-sm">
              <a
                href={`/?mapMode=admin-scoped&focusReport=${s.lost_report_id}&focusSighting=${s.id}`}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                View on platform map
              </a>
              <a
                href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-200"
              >
                Open in Google Maps
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-3">
              <button
                type="button"
                onClick={() => void updateStatus(s.id, "approved")}
                className="rounded-md border border-emerald-800 bg-emerald-950/50 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-950"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void updateStatus(s.id, "rejected")}
                className="rounded-md border border-red-800 bg-red-950/50 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
