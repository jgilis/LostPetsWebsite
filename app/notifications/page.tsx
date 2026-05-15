"use client";
import NotificationsClient from "./NotificationsClient";
import { supabase } from "../../src/lib/supabase";
import { useEffect } from "react";

export default function NotificationsPage() {

  useEffect(() => {
    async function check() {
      const { data: session } = await supabase.auth.getSession();
      console.log("SESSION:", session);
    }
  
    check();
  }, []);

  return <NotificationsClient />;
}