"use client";

import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

export function useAdminReportsSync(onSync: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("admin-reports-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          onSync();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onSync]);
}
