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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
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
      photo_url,
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
        photo_url: photo_url || null,
        status: "pending",
        reporter_ip_hash: ipHash,
        confidence_score: 1.0,
      })
      .select("id, lost_report_id, status, created_at")
      .single();

    if (error) {
      return jsonResponse({ error: { message: "Could not save the sighting" } }, 500);
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
