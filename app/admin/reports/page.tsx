"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import { getAllReports } from "../../../src/lib/reports";

type Report = {
  id: string;
  status: string;
  animal_type: string;
  description?: string | null;
};

export default function AdminAllReportsPage() {
  const { loading: adminLoading, isAdmin } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllReports();
        setReports(data);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (adminLoading) {
    return <p className="p-8 text-gray-400">Checking access...</p>;
  }

  if (!isAdmin) return null;

  if (loading) {
    return <p className="p-8 text-gray-400">Loading reports...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title="All Reports" showBackLink />

      {reports.length === 0 && (
        <p className="text-gray-400">No reports found.</p>
      )}

      <div className="flex flex-col gap-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-200"
          >
            <p>
              <span className="font-semibold">{r.animal_type}</span>
              <span className="text-gray-400"> — {r.status}</span>
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {r.description || "No description"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
