"use client";

import Link from "next/link";
import { memo, useLayoutEffect, useRef, useState } from "react";
import type { ProximityEvent } from "@/src/lib/geo/types";
import { formatProximityDistance } from "@/src/lib/geo/formatProximityDistance";
import {
  getAttentionFlags,
  getDominantAttention,
} from "@/src/lib/geo/proximityAttention";
import { isSeen, markSeen } from "@/src/lib/geo/proximityMemory";
import { reportDetailHref } from "@/src/lib/reportNavigation";

type ProximityEventRowProps = {
  event: ProximityEvent;
};

function ProximityEventRow({ event }: ProximityEventRowProps) {
  const { report, distanceMeters } = event;
  const markedRef = useRef(false);
  const [, setDisplayRevision] = useState(0);

  useLayoutEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;

    const wasUnseen = !isSeen(report.id);
    markSeen(report.id);

    if (wasUnseen) {
      setDisplayRevision((revision) => revision + 1);
    }
  }, [report.id]);

  const attention = getDominantAttention(getAttentionFlags(event));
  const showAsSeen = attention === "seen" || isSeen(report.id);

  const title =
    report.animal_name?.trim() ||
    `${report.type} ${report.animal_type}`;

  const rowClass =
    showAsSeen
      ? "text-sm text-gray-500 opacity-60"
      : attention === "very-close"
        ? "text-sm font-medium text-gray-100"
        : "text-sm text-gray-300";

  const linkClass =
    showAsSeen
      ? "text-gray-500 hover:text-gray-400 hover:underline"
      : attention === "very-close"
        ? "text-gray-100 hover:text-white hover:underline"
        : "text-gray-300 hover:text-gray-200 hover:underline";

  const attentionLabel =
    attention === "very-close"
      ? "Very close"
      : attention === "new-nearby" && !showAsSeen
        ? "New nearby"
        : showAsSeen
          ? "Seen"
          : null;

  const attentionClass =
    attention === "very-close"
      ? "ml-1 text-xs font-medium text-gray-300"
      : attention === "new-nearby" && !showAsSeen
        ? "ml-1 text-xs text-gray-500"
        : "ml-1 text-[11px] text-gray-600";

  return (
    <li className={rowClass}>
      <Link href={reportDetailHref(report.id, "map")} className={linkClass}>
        {title}
      </Link>
      <span className="text-gray-500">
        {" "}
        · {formatProximityDistance(distanceMeters)}
      </span>
      {attentionLabel ? (
        <span className={attentionClass}>{attentionLabel}</span>
      ) : null}
    </li>
  );
}

function areProximityEventRowsEqual(
  previous: ProximityEventRowProps,
  next: ProximityEventRowProps,
): boolean {
  return (
    previous.event.report.id === next.event.report.id &&
    Math.round(previous.event.distanceMeters) ===
      Math.round(next.event.distanceMeters)
  );
}

export default memo(ProximityEventRow, areProximityEventRowsEqual);
