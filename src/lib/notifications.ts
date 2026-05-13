import { supabase } from "./supabase";
import { getOwnerToken } from "./owner";

export async function getOwnerSightingsNotifications() {
  const ownerToken = getOwnerToken();

  if (!ownerToken) {
    return [];
  }

  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("type", "sighting_approved")
    .eq("target_user_id", ownerToken)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}