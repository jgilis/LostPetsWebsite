import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// New report submission contract. The production frontend still calls
// verify-captcha, which must not apply a location offset (the old client
// already does). This function applies the offset once and uploads photos
// only after CAPTCHA succeeds.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUBMISSION_CONTRACT = "v2";
const REPORT_TYPES = ["lost", "found"] as const;
const ANIMAL_TYPES = ["dog", "cat", "bird", "rodent", "other"] as const;
const MIN_DESCRIPTION_LENGTH = 5;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_ANIMAL_NAME_LENGTH = 80;
/** Must stay in sync with src/lib/reportValidation.ts LOCATION_OFFSET_SPAN. */
const LOCATION_OFFSET_SPAN = 0.0005;
const MAX_SOURCE_PHOTO_BYTES = 5_242_880;
const MAX_ENCODED_PHOTO_BYTES = 1_500_000;
const PHOTO_BUCKET = "report-photos";

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

function isAllowed(value: unknown, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value);
}

function decodePhotoBase64(value: unknown): Uint8Array | null {
  if (value == null) return new Uint8Array();
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

/** Drop EXIF/APP/COM segments from a client-re-encoded JPEG. */
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

function validateReport(report: Record<string, unknown>) {
  if (!isAllowed(report.type, REPORT_TYPES)) {
    return "Invalid report";
  }
  if (!isAllowed(report.animal_type, ANIMAL_TYPES)) {
    return "Invalid report";
  }

  const description =
    typeof report.description === "string" ? report.description.trim() : "";
  if (
    description.length < MIN_DESCRIPTION_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return "Invalid report";
  }

  const animalName =
    report.animal_name == null
      ? ""
      : typeof report.animal_name === "string"
        ? report.animal_name.trim()
        : null;
  if (animalName == null || animalName.length > MAX_ANIMAL_NAME_LENGTH) {
    return "Invalid report";
  }

  const latitude = report.latitude;
  const longitude = report.longitude;
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
    return "Invalid report";
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const token = body?.token;
    const report = body?.report;

    if (!token || typeof token !== "string") {
      return json(400, { success: false, error: "Missing captcha token" });
    }

    if (!report || typeof report !== "object") {
      return json(400, { success: false, error: "Invalid report" });
    }

    if (body.contract !== SUBMISSION_CONTRACT) {
      return json(400, {
        success: false,
        error: "Unsupported submission contract",
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return json(401, { success: false, error: "Authentication required" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return json(401, { success: false, error: "Authentication required" });
    }

    const validationError = validateReport(report);
    if (validationError) {
      return json(400, { success: false, error: validationError });
    }

    const photoBytes = decodePhotoBase64(body.photo_base64);
    if (photoBytes == null) {
      return json(400, { success: false, error: "Invalid photo" });
    }

    const secret =
      Deno.env.get("HCAPTCHA_SECRET_KEY") ?? Deno.env.get("HCAPTCHA_SECRET");
    if (!secret) {
      return json(500, { success: false, error: "Captcha not configured" });
    }

    const verifyBody = new URLSearchParams({
      secret,
      response: token,
    });
    const forwarded = req.headers.get("x-forwarded-for");
    const remoteip = forwarded?.split(",")[0]?.trim();
    if (remoteip) {
      verifyBody.set("remoteip", remoteip);
    }

    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody,
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return json(400, { success: false, error: "Captcha failed" });
    }

    let photoPath: string | null = null;
    let photoUrl: string | null = null;

    if (photoBytes.byteLength > 0) {
      let encoded: Uint8Array;
      try {
        encoded = sanitizeJpeg(photoBytes);
      } catch {
        return json(400, { success: false, error: "Invalid photo" });
      }

      photoPath = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(photoPath, encoded, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return json(500, { success: false, error: "Photo upload failed" });
      }

      const { data: publicUrlData } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(photoPath);
      photoUrl = publicUrlData.publicUrl ?? null;
    }

    const { latitude, longitude } = applyLocationOffset(
      report.latitude as number,
      report.longitude as number,
    );

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(now.getDate() + 120);
    const editToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          type: report.type,
          animal_type: report.animal_type,
          animal_name:
            typeof report.animal_name === "string"
              ? report.animal_name.trim()
              : "",
          description: (report.description as string).trim(),
          latitude,
          longitude,
          contact_info: "",
          photo_url: photoUrl,
          status: "active",
          edit_token: editToken,
          date_reported: now.toISOString(),
          expires_at: expires.toISOString(),
          owner_user_id: user.id,
        },
      ])
      .select(
        "id, type, animal_type, animal_name, description, latitude, longitude, contact_info, photo_url, status, expires_at, owner_user_id, created_at, date_reported",
      );

    if (error) {
      if (photoPath) {
        await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
      }
      return json(500, { success: false, error: "Database insert failed" });
    }

    return json(200, { success: true, report: data?.[0] ?? null });
  } catch {
    return json(500, { success: false, error: "Unexpected error" });
  }
});
