// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ ADD: CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  try {
    // ✅ ADD: handle preflight request
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    const { token, report } = await req.json();

    if (!token) {
      return json({ success: false, error: "Missing captcha token" }, 400);
    }

    if (!report) {
      return json({ success: false, error: "Missing report data" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Authentication required" }, 401);
    }

    const secret = Deno.env.get("HCAPTCHA_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!secret || !supabaseUrl || !serviceKey) {
      return json({ success: false, error: "Missing env vars" }, 500);
    }

    // 🛡️ 1. Verify CAPTCHA
    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const captchaData = await verifyRes.json();

    if (!captchaData.success) {
      return json({ success: false, error: "Captcha failed" }, 400);
    }

    // 🗄️ 2. Supabase client (server-side)
    const supabase = createClient(supabaseUrl, serviceKey);

    const jwt = authHeader.slice("Bearer ".length);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return json({ success: false, error: "Authentication required" }, 401);
    }

    const editToken = crypto.randomUUID();

    // 🧾 3. Insert report
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          type: report.type,
          animal_type: report.animal_type,
          animal_name: report.animal_name || null,
          description: report.description || null,
          latitude: report.latitude,
          longitude: report.longitude,
          contact_info: report.contact_info,
          photo_url: report.photo_url || null,
          status: "active",
          edit_token: editToken,
          date_reported: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 4).toISOString(),
          owner_user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return json({ success: false, error: error.message }, 500);
    }

    return json({
      success: true,
      report: data,
      edit_link: `${Deno.env.get("PUBLIC_BASE_URL")}/edit?token=${editToken}`,
    });

  } catch (err) {
    return json({ success: false, error: String(err) }, 500);
  }
});

// ✅ UPDATED: include CORS headers in all responses
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}