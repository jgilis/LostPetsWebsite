"use client";

import { useAdmin } from "../../src/hooks/useAdmin";
import { supabase } from "../../src/lib/supabase";

export default function AdminHome() {
  const { loading, isAdmin } = useAdmin();

  if (loading) {
    return <p style={{ padding: "2rem" }}>Checking access...</p>;
  }

  // 🛡️ extra safety guard (prevents flash of content)
  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Panel</h1>

      <ul>
        <li><a href="/admin/reports">All Reports</a></li>
        <li><a href="/admin/flags">Flagged Reports</a></li>
      </ul>

      <button
        onClick={() => supabase.auth.signOut()}
      >
        Log out
      </button>
    </div>
  );
}