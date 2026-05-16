// @ts-nocheck
// Deploy + attach a Database Webhook on notification_events INSERT (see function header).
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_CONTACT_EMAIL, PUSH_WEBHOOK_SECRET

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

type NotificationRecord = {
  id?: string;
  type?: string;
  target_user_id?: string | null;
  payload?: {
    sighting_id?: string;
    lost_report_id?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
  };
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function formatPushContent(record: NotificationRecord) {
  const payload = record.payload ?? {};
  const sightingId = payload.sighting_id;
  const reportId = payload.lost_report_id;

  let title = "Lost Pets alert";
  let body = "You have a new notification.";
  let url = "/notifications";

  switch (record.type) {
    case "sighting_approved":
      title = "Sighting approved";
      body = "A sighting on your lost pet report was approved.";
      if (sightingId) url = `/sightings/${sightingId}`;
      else if (reportId) {
        url = `/?mapMode=admin-scoped&focusReport=${reportId}`;
      }
      break;
    case "sighting_rejected":
      title = "Sighting update";
      body = "A sighting on your report was not approved.";
      url = "/notifications";
      break;
    case "sighting_updated":
      title = "Sighting update";
      body = "A sighting on your report was updated.";
      if (sightingId) url = `/sightings/${sightingId}`;
      break;
    default:
      if (record.type) {
        body = String(record.type).replace(/_/g, " ");
      }
      break;
  }

  return { title, body, url };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!webhookSecret || providedSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidContact =
    Deno.env.get("VAPID_CONTACT_EMAIL") ?? "mailto:lostpetsbelgium@gmail.com";

  if (!vapidPublic || !vapidPrivate) {
    return new Response("VAPID not configured", { status: 500 });
  }

  webpush.setVapidDetails(vapidContact, vapidPublic, vapidPrivate);

  let body: { record?: NotificationRecord; type?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const record = body.record ?? (body as NotificationRecord);
  const userId = record?.target_user_id;
  if (!userId) {
    return new Response(JSON.stringify({ sent: 0, skipped: "no target_user_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase not configured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[send-push-on-notification]", error);
    return new Response("Failed to load subscriptions", { status: 500 });
  }

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, body: messageBody, url } = formatPushContent(record);
  const pushPayload = JSON.stringify({ title, body: messageBody, url });

  let sent = 0;
  const staleIds: string[] = [];

  for (const row of subscriptions as PushSubscriptionRow[]) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      await webpush.sendNotification(subscription, pushPayload);
      sent += 1;
    } catch (err) {
      const status = err?.statusCode ?? err?.status;
      console.error("[send-push-on-notification] send failed:", status, err?.body);
      if (status === 404 || status === 410) {
        staleIds.push(row.id);
      }
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return new Response(JSON.stringify({ sent, removed: staleIds.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
