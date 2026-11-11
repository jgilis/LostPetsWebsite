"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "../../../src/hooks/useAdmin";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import {
  getAdminSightings,
  resolveSightingPhotoUrl,
  updateSightingStatus,
} from "../../../src/lib/sightings";
import { getDistanceMeters } from "../../../src/lib/geo/haversine";

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
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  observed_at?: string | null;
  moderated_at?: string | null;
  reports?: ReportRef | null;
};

function AdminSightingPhoto({ photoUrl }: { photoUrl: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveSightingPhotoUrl(photoUrl).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className="mt-3 max-h-48 w-full rounded-md object-contain bg-black/30"
    />
  );
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
  const searchParams = useSearchParams();
  const pendingOnly = searchParams.get("filter") !== "all";
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

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
      setActionError("Could not update this sighting. Try again.");
      return;
    }

    setActionError(null);
    setSightings((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              moderated_at: new Date().toISOString(),
            }
          : s,
      ),
    );
  }

  if (adminLoading) {
    return <p className="p-8 text-gray-400">Checking access...</p>;
  }

  if (!isAdmin) return null;

  const visibleSightings = useMemo(
    () =>
      pendingOnly
        ? sightings.filter((sighting) => sighting.status === "pending")
        : sightings,
    [pendingOnly, sightings],
  );

  if (loading) {
    return <p className="p-8 text-gray-400">Loading sightings...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader
        title={pendingOnly ? "Sightings waiting" : "All Sightings"}
        showBackLink
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-300">{actionError}</p>
      ) : null}

      {visibleSightings.length === 0 && (
        <p className="text-gray-400">
          {pendingOnly ? "No sightings waiting." : "No sightings yet."}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {visibleSightings.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-200"
          >
            <p className="text-sm text-gray-400">
              {s.latitude != null && s.longitude != null
                ? `${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}`
                : "Exact location unavailable"}
            </p>

            {s.reports && (
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  {s.reports.animal_type}
                  {s.reports.animal_name ? ` (${s.reports.animal_name})` : ""}
                </p>
                {s.latitude != null && s.longitude != null && (
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
                )}
              </div>
            )}

            {s.observed_at ? (
              <p className="mt-2 text-sm text-gray-400">
                Seen: {new Date(s.observed_at).toLocaleString()}
              </p>
            ) : null}

            {s.moderated_at ? (
              <p className="mt-1 text-sm text-gray-500">
                Reviewed: {new Date(s.moderated_at).toLocaleString()}
              </p>
            ) : null}

            <p className="mt-2">{s.description || "No description"}</p>

            <AdminSightingPhoto photoUrl={s.photo_url} />

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
              {s.latitude != null && s.longitude != null && (
                <a
                  href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-200"
                >
                  Open in Google Maps
                </a>
              )}
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
