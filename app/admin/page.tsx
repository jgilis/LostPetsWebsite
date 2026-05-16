"use client";

import Link from "next/link";
import { useAdmin } from "../../src/hooks/useAdmin";
import AdminHeader from "../../src/components/admin/AdminHeader";

export default function AdminHome() {
  const { loading, isAdmin } = useAdmin();

  if (loading) {
    return <p className="p-8 text-gray-400">Checking access...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader />

      <nav className="flex flex-col gap-2">
        <Link
          href="/admin/reports"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          All Reports
        </Link>
        <Link
          href="/admin/flags"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          Flagged Reports
        </Link>
        <Link
          href="/admin/sightings"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          All Sightings
        </Link>
      </nav>
    </div>
  );
}
