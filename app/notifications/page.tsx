"use client";
import NotificationsClient from "./NotificationsClient";
import { supabase } from "../../src/lib/supabase";
import { useEffect } from "react";

export default function NotificationsPage() {

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      console.log("USER:", data.user);
    }
  
    checkUser();
  }, []);

  return <NotificationsClient />;
}