import { supabase } from "./supabase";
import { getOwnerToken } from "./owner";

export async function getOwnerSightingsNotifications() {
  const ownerToken = getOwnerToken();

  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("target_user_id", ownerToken)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}