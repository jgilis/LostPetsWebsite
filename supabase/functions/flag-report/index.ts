import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    // 🌐 CORS
    const origin = req.headers.get("origin") ?? "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const { reportId, reason } = await req.json();

    console.log("FLAGGING REPORT ID:", reportId);
    console.log("FLAG REASON:", reason);

    if (!reportId || !reason) {
      return json({ success: false, error: "Missing data" }, 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return json({ success: false, error: "Missing env vars" }, 500, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 🧠 Extract IP
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // 🔐 Hash IP
    const ipHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(ip)
    );

    const ipHash = [...new Uint8Array(ipHashBuffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 🚦 RATE LIMIT: max 3 flags per 10 minutes per IP
    const windowMinutes = 10;
    const limit = 3;

    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { count: rlCount, error: rlError } = await supabase
      .from("reports_flags")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (rlError) {
      return json(
        { success: false, error: "Rate limit check failed" },
        500,
        corsHeaders
      );
    }

    if ((rlCount ?? 0) >= limit) {
      return json(
        { success: false, error: "Too many flags. Please try again later." },
        429,
        corsHeaders
      );
    }

    // 🚫 Prevent duplicate flag
    const { data: existing } = await supabase
      .from("reports_flags")
      .select("id")
      .eq("report_id", reportId)
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (existing) {
      return json({ success: true, message: "Already flagged" }, 200, corsHeaders);
    }

    // 🧾 Insert flag
    /* const { error } = await supabase.from("reports_flags").insert([
      {
        report_id: reportId,
        reason,
        ip_hash: ipHash,
      },
    ]); */

    const { data: inserted, error } = await supabase
      .from("reports_flags")
      .insert([
        {
          report_id: reportId,
          reason,
          ip_hash: ipHash,
        },
      ])
      .select();

    console.log("ABUSE_EVENT", {
      reportId,
      ipHash,
      reason,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      return json({ success: false, error: error.message }, 500, corsHeaders);
    }

    // 📊 Count UNIQUE flags
    const { data } = await supabase
      .from("reports_flags")
      .select("ip_hash")
      .eq("report_id", reportId);

    const uniqueIps = new Set(data?.map((d) => d.ip_hash));
    const count = uniqueIps.size;

    // 🚨 Threshold logic
    const FLAG_THRESHOLD = 2;

    if (count >= FLAG_THRESHOLD) {
      console.log("FLAG THRESHOLD REACHED for report:", reportId);

      await supabase
        .from("reports")
        .update({ status: "flagged" })
        .eq("id", reportId);
    }

        return json({ success: true }, 200, corsHeaders);
      } catch (err) {
        return json({ success: false, error: String(err) }, 500, {
          "Access-Control-Allow-Origin": "*",
        });
      }
    });

function json(data: any, status = 200, headers: any = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
