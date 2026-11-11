import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Authenticated owner photo and pin edits on active reports.
// Identify the caller with the user JWT, then use the service role only
// after ownership and active status are confirmed. The service-role key
// stays in this function. Do not accept type, status, or a client photo_url.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIN_DESCRIPTION_LENGTH = 5;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_ANIMAL_NAME_LENGTH = 80;
/** Must stay in sync with src/lib/reportValidation.ts LOCATION_OFFSET_SPAN. */
const LOCATION_OFFSET_SPAN = 0.0005;
const MAX_SOURCE_PHOTO_BYTES = 5_242_880;
const MAX_ENCODED_PHOTO_BYTES = 1_500_000;
const PHOTO_BUCKET = "report-photos";
const REPORT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function applyLocationOffset(lat: number, lng: number) {
  const latitude =
    Math.round((lat + (Math.random() - 0.5) * LOCATION_OFFSET_SPAN) * 1e6) /
    1e6;
  const longitude =
    Math.round((lng + (Math.random() - 0.5) * LOCATION_OFFSET_SPAN) * 1e6) /
    1e6;

  return {
    latitude: Math.min(90, Math.max(-90, latitude)),
    longitude: Math.min(180, Math.max(-180, longitude)),
  };
}

function decodePhotoBase64(value: unknown): Uint8Array | null {
  if (typeof value !== "string") return null;
  if (value.length === 0) return new Uint8Array();
  if (value.length > Math.ceil(MAX_ENCODED_PHOTO_BYTES * 1.4) + 32) return null;

  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function sanitizeJpeg(bytes: Uint8Array): Uint8Array {
  if (
    bytes.byteLength < 4 ||
    bytes.byteLength > MAX_SOURCE_PHOTO_BYTES ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8
  ) {
    throw new Error("Invalid photo");
  }

  const chunks: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;

  while (offset < bytes.byteLength) {
    if (bytes[offset] !== 0xff) {
      throw new Error("Invalid photo");
    }

    let markerOffset = offset + 1;
    while (markerOffset < bytes.byteLength && bytes[markerOffset] === 0xff) {
      markerOffset += 1;
    }
    if (markerOffset >= bytes.byteLength) {
      throw new Error("Invalid photo");
    }

    const marker = bytes[markerOffset];

    if (marker === 0xd9) {
      chunks.push(new Uint8Array([0xff, 0xd9]));
      break;
    }

    if (marker === 0xda) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    if (marker >= 0xd0 && marker <= 0xd7) {
      chunks.push(new Uint8Array([0xff, marker]));
      offset = markerOffset + 1;
      continue;
    }

    if (markerOffset + 2 >= bytes.byteLength) {
      throw new Error("Invalid photo");
    }

    const length =
      (bytes[markerOffset + 1] << 8) | bytes[markerOffset + 2];
    const next = markerOffset + 1 + length;
    if (length < 2 || next > bytes.byteLength) {
      throw new Error("Invalid photo");
    }

    const dropMetadata =
      (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!dropMetadata) {
      chunks.push(bytes.subarray(offset, next));
    }
    offset = next;
  }

  const sanitized = concatBytes(chunks);
  if (sanitized.byteLength > MAX_ENCODED_PHOTO_BYTES) {
    throw new Error("Invalid photo");
  }
  return sanitized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  try {
    const body = await req.json();
    const reportId = body?.report_id;
    if (typeof reportId !== "string" || !REPORT_ID_RE.test(reportId)) {
      return json(400, { success: false, error: "Invalid report" });
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const animalName =
      body.animal_name == null
        ? ""
        : typeof body.animal_name === "string"
          ? body.animal_name.trim()
          : null;
    if (
      description.length < MIN_DESCRIPTION_LENGTH ||
      description.length > MAX_DESCRIPTION_LENGTH ||
      animalName == null ||
      animalName.length > MAX_ANIMAL_NAME_LENGTH
    ) {
      return json(400, { success: false, error: "Invalid report" });
    }

    const hasPin = body.latitude != null || body.longitude != null;
    if (hasPin) {
      const latitude = body.latitude;
      const longitude = body.longitude;
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return json(400, { success: false, error: "Invalid location" });
      }
    }

    const wantsPhoto =
      body.photo_base64 != null && body.photo_base64 !== "";
    let encodedPhoto: Uint8Array | null = null;
    if (wantsPhoto) {
      const photoBytes = decodePhotoBase64(body.photo_base64);
      if (photoBytes == null || photoBytes.byteLength === 0) {
        return json(400, { success: false, error: "Invalid photo" });
      }
      try {
        encodedPhoto = sanitizeJpeg(photoBytes);
      } catch {
        return json(400, { success: false, error: "Invalid photo" });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !anonKey) {
      return json(500, { success: false, error: "Could not save changes" });
    }
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return json(401, { success: false, error: "Authentication required" });
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(jwt);

    if (userError || !user) {
      return json(401, { success: false, error: "Authentication required" });
    }

    const { data: report, error: reportError } = await supabaseUser
      .from("reports")
      .select("id, owner_user_id, status")
      .eq("id", reportId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (reportError) {
      return json(500, { success: false, error: "Could not save changes" });
    }

    if (!report || report.owner_user_id !== user.id) {
      return json(404, { success: false, error: "Report not found" });
    }

    if (report.status !== "active") {
      return json(400, {
        success: false,
        error: "Photo and location can only be changed while the report is active",
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serviceKey) {
      return json(500, { success: false, error: "Could not save changes" });
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${serviceKey}` } },
    });

    const patch: Record<string, unknown> = {
      description,
      animal_name: animalName,
    };

    if (hasPin) {
      const offset = applyLocationOffset(body.latitude, body.longitude);
      patch.latitude = offset.latitude;
      patch.longitude = offset.longitude;
    }

    let photoPath: string | null = null;
    if (encodedPhoto) {
      photoPath = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .upload(photoPath, encodedPhoto, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return json(500, { success: false, error: "Photo upload failed" });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(photoPath);
      patch.photo_url = publicUrlData.publicUrl ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from("reports")
      .update(patch)
      .eq("id", reportId)
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .select(
        "id, animal_name, description, latitude, longitude, photo_url, status",
      )
      .maybeSingle();

    if (error || !data) {
      console.error("owner-update-report update:", error);
      if (photoPath) {
        await supabaseAdmin.storage.from(PHOTO_BUCKET).remove([photoPath]);
      }
      return json(500, { success: false, error: "Could not save changes" });
    }

    return json(200, { success: true, report: data });
  } catch {
    return json(500, { success: false, error: "Unexpected error" });
  }
});
