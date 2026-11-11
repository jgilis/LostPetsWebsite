import { supabase } from "./supabase";

export const AREA_RADIUS_METERS = [500, 1000, 2000] as const;
export type AreaRadiusMeters = (typeof AREA_RADIUS_METERS)[number];

export const AREA_ANIMAL_TYPES = [
  "dog",
  "cat",
  "bird",
  "rodent",
  "other",
] as const;
export type AreaAnimalType = (typeof AREA_ANIMAL_TYPES)[number];

export const MAX_AREA_SUBSCRIPTIONS = 5;
export const MAX_AREA_LABEL_LENGTH = 40;
export const AREA_NOTIFICATION_TYPE = "lost_report_in_area";

export const AREA_SUBSCRIPTION_SELECT =
  "id, user_id, label, latitude, longitude, radius_m, animal_type, enabled, created_at";

export type AreaSubscription = {
  id: string;
  user_id: string;
  label: string;
  latitude: number;
  longitude: number;
  radius_m: AreaRadiusMeters;
  animal_type: AreaAnimalType | null;
  enabled: boolean;
  created_at: string;
};

export type AreaSubscriptionWrite = {
  label: string;
  latitude: number;
  longitude: number;
  radius_m: AreaRadiusMeters;
  animal_type: AreaAnimalType | null;
  enabled?: boolean;
};

function isAreaRadius(value: number): value is AreaRadiusMeters {
  return (AREA_RADIUS_METERS as readonly number[]).includes(value);
}

function isAreaAnimalType(value: string): value is AreaAnimalType {
  return (AREA_ANIMAL_TYPES as readonly string[]).includes(value);
}

function normalizeRow(row: {
  id: string;
  user_id: string;
  label: string;
  latitude: number | string;
  longitude: number | string;
  radius_m: number;
  animal_type: string | null;
  enabled: boolean;
  created_at: string;
}): AreaSubscription | null {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (!isAreaRadius(row.radius_m)) return null;
  const animalType =
    row.animal_type && isAreaAnimalType(row.animal_type)
      ? row.animal_type
      : null;
  return {
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    latitude,
    longitude,
    radius_m: row.radius_m,
    animal_type: animalType,
    enabled: row.enabled,
    created_at: row.created_at,
  };
}

async function getAuthUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function listAreaSubscriptions(): Promise<AreaSubscription[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("area_subscriptions")
    .select(AREA_SUBSCRIPTION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizeRow(row))
    .filter((row): row is AreaSubscription => row != null);
}

export async function createAreaSubscription(
  input: AreaSubscriptionWrite,
): Promise<{ ok: true; zone: AreaSubscription } | { ok: false }> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false };

  const label = input.label.trim().slice(0, MAX_AREA_LABEL_LENGTH);
  if (!label || !isAreaRadius(input.radius_m)) return { ok: false };
  if (
    input.animal_type != null &&
    !isAreaAnimalType(input.animal_type)
  ) {
    return { ok: false };
  }

  const { data, error } = await supabase
    .from("area_subscriptions")
    .insert({
      user_id: userId,
      label,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_m: input.radius_m,
      animal_type: input.animal_type,
      enabled: input.enabled ?? true,
    })
    .select(AREA_SUBSCRIPTION_SELECT)
    .single();

  if (error || !data) {
    console.error(error);
    return { ok: false };
  }

  const zone = normalizeRow(data);
  return zone ? { ok: true, zone } : { ok: false };
}

export async function updateAreaSubscription(
  id: string,
  patch: Partial<Pick<AreaSubscriptionWrite, "label" | "enabled" | "radius_m" | "animal_type">>,
): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const updates: Record<string, unknown> = {};
  if (typeof patch.label === "string") {
    updates.label = patch.label.trim().slice(0, MAX_AREA_LABEL_LENGTH);
  }
  if (typeof patch.enabled === "boolean") updates.enabled = patch.enabled;
  if (patch.radius_m != null) {
    if (!isAreaRadius(patch.radius_m)) return false;
    updates.radius_m = patch.radius_m;
  }
  if (patch.animal_type !== undefined) {
    if (patch.animal_type != null && !isAreaAnimalType(patch.animal_type)) {
      return false;
    }
    updates.animal_type = patch.animal_type;
  }
  if (Object.keys(updates).length === 0) return false;

  const { error } = await supabase
    .from("area_subscriptions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

export async function deleteAreaSubscription(id: string): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("area_subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return false;
  }
  return true;
}
