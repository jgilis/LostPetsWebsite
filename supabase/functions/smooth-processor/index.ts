// @ts-nocheck
// Deployed name: smooth-processor
// The current sighting form posts here with no Authorization header.
// Deploy with verify_jwt disabled so that client keeps working.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const MAX_SOURCE_PHOTO_BYTES = 5_242_880;
const MAX_ENCODED_PHOTO_BYTES = 1_500_000;
const PHOTO_BUCKET = "sighting-photos";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
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

function parseObservedAt(value: unknown, now: number): string | null {
  if (value == null || value === "") {
    return new Date(now).toISOString();
  }
  if (typeof value !== "string") return null;
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return null;
  if (at > now) return null;
  return new Date(at).toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { message: "Method not allowed" } }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();

    const {
      lost_report_id,
      latitude,
      longitude,
      description,
      observed_at,
      photo_base64,
    } = body;

    if (
      !lost_report_id ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return jsonResponse({ error: { message: "Invalid or missing fields" } }, 400);
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(lost_report_id),
      )
    ) {
      return jsonResponse({ error: { message: "Invalid or missing fields" } }, 400);
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return jsonResponse({ error: { message: "Invalid coordinates" } }, 400);
    }

    const now = Date.now();
    const observedAt = parseObservedAt(observed_at, now);
    if (!observedAt) {
      return jsonResponse({ error: { message: "Invalid observation time" } }, 400);
    }

    const photoBytes = decodePhotoBase64(photo_base64);
    if (photoBytes == null) {
      return jsonResponse({ error: { message: "Invalid photo" } }, 400);
    }

    let encodedPhoto: Uint8Array | null = null;
    if (photoBytes.byteLength > 0) {
      try {
        encodedPhoto = sanitizeJpeg(photoBytes);
      } catch {
        return jsonResponse({ error: { message: "Invalid photo" } }, 400);
      }
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, type, status")
      .eq("id", lost_report_id)
      .maybeSingle();

    if (reportError) {
      return jsonResponse({ error: { message: "Could not check the report" } }, 500);
    }

    if (!report || report.type !== "lost" || report.status !== "active") {
      return jsonResponse(
        { error: { message: "Sightings can only be added to an active lost report" } },
        400,
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipData = new TextEncoder().encode(ip);
    const hashBuffer = await crypto.subtle.digest("SHA-256", ipData);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const ONE_MINUTE = 60 * 1000;
    const { count } = await supabase
      .from("sightings")
      .select("*", { count: "exact", head: true })
      .eq("reporter_ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - ONE_MINUTE).toISOString());

    if (count && count >= 5) {
      return jsonResponse(
        { error: { message: "Too many sightings. Slow down." } },
        429,
      );
    }

    const { data, error } = await supabase
      .from("sightings")
      .insert({
        lost_report_id,
        latitude,
        longitude,
        description: description || null,
        photo_url: null,
        status: "pending",
        reporter_ip_hash: ipHash,
        confidence_score: 1.0,
        observed_at: observedAt,
      })
      .select("id, lost_report_id, status, created_at, observed_at")
      .single();

    if (error) {
      return jsonResponse({ error: { message: "Could not save the sighting" } }, 500);
    }

    if (encodedPhoto && data?.id) {
      const photoPath = `${data.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(photoPath, encodedPhoto, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (!uploadError) {
        const { error: photoUpdateError } = await supabase
          .from("sightings")
          .update({ photo_url: photoPath })
          .eq("id", data.id);

        if (photoUpdateError) {
          await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
        }
      }
    }

    return jsonResponse({ success: true, sighting: data }, 200);
  } catch (err) {
    return jsonResponse(
      {
        error: { message: "Server error" },
        details: String(err),
      },
      500,
    );
  }
});
