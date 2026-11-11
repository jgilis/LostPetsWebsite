"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../../src/components/notifications/NotificationsProvider";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { canSeeExactSightings } from "@/src/lib/permissions";
import { activityEventFocusHref } from "@/src/lib/reportNavigation";
import { getPublicSightingById, withExactCoordinates } from "../../../src/lib/sightings";

const SightingMap = dynamic(() => import("../../../src/components/sightings/SightingMap"), {
  ssr: false,
});

const MODERATION_EVENT_TYPES = new Set([
  "sighting_approved",
  "sighting_rejected",
  "sighting_updated",
]);

type SightingDetail = {
  id: string;
  status: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  report?: unknown;
  [key: string]: unknown;
};

type LinkedReport = {
  id?: string;
  latitude?: number;
  longitude?: number;
  animal_type?: string;
  animal_name?: string | null;
  owner_user_id?: string | null;
} | null;

function isModerationEvent(type: string) {
  return MODERATION_EVENT_TYPES.has(type);
}

function linkedReport(sighting: SightingDetail): LinkedReport {
  const report = Array.isArray(sighting.report)
    ? sighting.report[0]
    : sighting.report;
  return (report as LinkedReport) ?? null;
}

function withoutExactPoint(sighting: SightingDetail): SightingDetail {
  return {
    ...sighting,
    latitude: null,
    longitude: null,
  };
}

export default function SightingClient({
  sighting: initialSighting,
}: {
  sighting: SightingDetail;
}) {
  const [sighting, setSighting] = useState(() =>
    withoutExactPoint(initialSighting),
  );
  const { events } = useNotifications();
  const lastHandledEventId = useRef<string | null>(null);
  const { userId, isAdmin, loading: authLoading } = useCurrentUser();
  const { t } = useTranslation();
  const report = linkedReport(sighting);
  const canSeeExact = canSeeExactSightings(
    userId,
    isAdmin,
    report?.owner_user_id,
  );

  useEffect(() => {
    setSighting(withoutExactPoint(initialSighting));
    lastHandledEventId.current = null;
    if (authLoading) return;

    if (!canSeeExact) {
      return;
    }

    let cancelled = false;
    void withExactCoordinates([initialSighting]).then((rows) => {
      if (cancelled) return;
      const exact = rows[0];
      if (exact?.latitude == null || exact.longitude == null) return;
      setSighting((current) => ({
        ...current,
        latitude: exact.latitude,
        longitude: exact.longitude,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, canSeeExact, initialSighting]);

  useEffect(() => {
    const moderationEvent = events.find(
      (event) =>
        isModerationEvent(event.type) &&
        event.payload.sighting_id === initialSighting.id,
    );

    if (!moderationEvent) return;
    if (lastHandledEventId.current === moderationEvent.id) return;

    lastHandledEventId.current = moderationEvent.id;

    void getPublicSightingById(initialSighting.id).then(async (fresh) => {
      if (!fresh) return;
      if (!canSeeExact) {
        setSighting(withoutExactPoint(fresh as SightingDetail));
        return;
      }
      const [withLocation] = await withExactCoordinates([fresh]);
      setSighting(withLocation as SightingDetail);
    });
  }, [canSeeExact, events, initialSighting.id]);

  const reportDetails = report;
  const mapReport =
    canSeeExact &&
    reportDetails?.latitude != null &&
    reportDetails?.longitude != null
      ? {
          latitude: reportDetails.latitude,
          longitude: reportDetails.longitude,
        }
      : null;
  const discoverHref = reportDetails?.id
    ? activityEventFocusHref(reportDetails.id)
    : "/?tab=discover";

  if (authLoading) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: 24 }}>
          🐾 Sighting Detail
        </h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: 24 }}>
        🐾 Sighting Detail
      </h1>
      {canSeeExact ? (
        <SightingMap sighting={sighting} report={mapReport} />
      ) : (
        <div className="mb-5 space-y-2 text-lp-ink">
          <p>{t("activitySightingNearby")}</p>
          {reportDetails?.latitude != null &&
          reportDetails?.longitude != null ? (
            <LocationDisplay
              latitude={reportDetails.latitude}
              longitude={reportDetails.longitude}
            />
          ) : null}
        </div>
      )}
      <div>
        <h2>
          {reportDetails?.animal_type} {reportDetails?.animal_name || ""}
        </h2>

        <p>{sighting.description || "No description"}</p>

        <p>Status: {sighting.status}</p>

        <p className="mt-4">
          <Link href={discoverHref} className="text-lp-sage-dark underline">
            {t("activityViewOnDiscover")}
          </Link>
        </p>
      </div>
    </div>
  );
}
