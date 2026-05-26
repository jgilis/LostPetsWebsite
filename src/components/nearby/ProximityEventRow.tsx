"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ProximityEvent } from "@/src/lib/geo/types";
import {
  getAttentionFlags,
  getDominantAttention,
} from "@/src/lib/geo/proximityAttention";
import { markSeen } from "@/src/lib/geo/proximityMemory";
import { reportDetailHref } from "@/src/lib/reportNavigation";

type ProximityEventRowProps = {
  event: ProximityEvent;
};

export default function ProximityEventRow({ event }: ProximityEventRowProps) {
  const { report, distanceMeters } = event;
  const markedRef = useRef(false);
  const attention = getDominantAttention(getAttentionFlags(event));

  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    markSeen(report.id);
  }, [report.id]);

  const title =
    report.animal_name?.trim() ||
    `${report.type} ${report.animal_type}`;

  const rowClass =
    attention === "seen"
      ? "text-sm text-gray-500 opacity-70"
      : attention === "very-close"
        ? "text-sm font-medium text-gray-100"
        : attention === "new-nearby"
          ? "text-sm text-gray-200"
          : "text-sm text-gray-300";

  const linkClass =
    attention === "seen"
      ? "text-gray-400 hover:text-gray-300 hover:underline"
      : attention === "very-close"
        ? "text-gray-100 hover:text-white hover:underline"
        : attention === "new-nearby"
          ? "text-gray-100 hover:text-white hover:underline"
          : "text-gray-200 hover:text-white hover:underline";

  const attentionLabel =
    attention === "very-close"
      ? "Very close"
      : attention === "new-nearby"
        ? "NEW nearby"
        : attention === "seen"
          ? "seen"
          : null;

  return (
    <li className={rowClass}>
      <Link href={reportDetailHref(report.id, "map")} className={linkClass}>
        {title}
      </Link>
      <span className="text-gray-500"> · {Math.round(distanceMeters)}m</span>
      {attentionLabel ? (
        <span
          className={
            attention === "seen"
              ? "ml-1 text-xs text-gray-600"
              : "ml-1 text-xs text-gray-400"
          }
        >
          {attentionLabel}
        </span>
      ) : null}
    </li>
  );
}
