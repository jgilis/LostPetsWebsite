"use client";

import { useEffect } from "react";
import { useNotifications } from "../../src/components/notifications/NotificationsProvider";
import { AREA_NOTIFICATION_TYPE } from "@/src/lib/areaSubscriptions";
import { activityEventFocusHref } from "@/src/lib/reportNavigation";
import { useTranslation } from "@/src/i18n/I18nProvider";
import LocationDisplay from "@/src/components/location/LocationDisplay";

export default function NotificationsClient() {
  const { events, loading, loadNotifications } = useNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    void loadNotifications({ markRead: true });
  }, [loadNotifications]);

  if (loading) {
    return <p style={{ padding: "20px" }}>{t("notificationsLoading")}</p>;
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        🔔 {t("notificationsTitle")}
      </h1>

      {events.length === 0 && <p>{t("notificationsEmpty")}</p>}

      {events.map((event) => {
        const isAreaAlert = event.type === AREA_NOTIFICATION_TYPE;
        const reportId = event.payload.lost_report_id;
        const hasCoarsePlace =
          event.payload.latitude != null &&
          event.payload.longitude != null &&
          Number.isFinite(event.payload.latitude) &&
          Number.isFinite(event.payload.longitude);

        return (
        <div
          key={event.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "12px",
            background: "#fff",
          }}
        >
          <p
            style={{
              fontWeight: 600,
              color: "#444",
              marginBottom: "6px",
            }}
          >
            🐾 {isAreaAlert ? t("notificationsAreaTitle") : t("notificationsSightingApproved")}
          </p>

          <p
            style={{
              marginBottom: "6px",
              color: "#444",
            }}
          >
            {isAreaAlert ? t("notificationsAreaBody") : t("notificationsSightingBody")}
          </p>

          {hasCoarsePlace ? (
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                marginBottom: "6px",
              }}
            >
              {t("notificationsApproxArea")}{" "}
              <LocationDisplay
                latitude={event.payload.latitude}
                longitude={event.payload.longitude}
              />
            </p>
          ) : null}

          <p
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            {new Date(event.created_at).toLocaleString()}
          </p>

          {isAreaAlert && reportId ? (
            <a
              href={activityEventFocusHref(reportId)}
              style={{
                display: "inline-block",
                marginTop: "10px",
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {t("notificationsViewOnDiscover")} →
            </a>
          ) : null}

          {!isAreaAlert && event.payload.sighting_id ? (
            <a
              href={`/sightings/${event.payload.sighting_id}`}
              style={{
                display: "inline-block",
                marginTop: "10px",
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {t("notificationsViewSighting")} →
            </a>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
