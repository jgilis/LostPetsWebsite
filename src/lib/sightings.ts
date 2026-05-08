export type SightingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export interface Sighting {
  id: string;
  lost_report_id: string;

  created_at: string;

  latitude: number;
  longitude: number;

  location_accuracy_meters?: number | null;

  description?: string | null;

  photo_url?: string | null;

  status: SightingStatus;

  reporter_ip_hash: string;

  moderated_at?: string | null;

  moderation_reason?: string | null;

  reviewed_by?: string | null;

  expires_at?: string | null;
}