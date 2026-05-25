"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ProximityEvent } from "@/src/lib/geo/types";
import { isSeen, markSeen } from "@/src/lib/geo/proximityMemory";
import { reportDetailHref } from "@/src/lib/reportNavigation";

type ProximityEventRowProps = {
  event: ProximityEvent;
};

export default function ProximityEventRow({ event }: ProximityEventRowProps) {
  const { report, distanceMeters } = event;
  const markedRef = useRef(false);
  const seen = isSeen(report.id);

  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    markSeen(report.id);
  }, [report.id]);

  const title =
    report.animal_name?.trim() ||
    `${report.type} ${report.animal_type}`;

  return (
    <li
      className={
        seen
          ? "text-sm text-gray-500 opacity-70"
          : "text-sm text-gray-300"
      }
    >
      <Link
        href={reportDetailHref(report.id, "map")}
        className={
          seen
            ? "text-gray-400 hover:text-gray-300 hover:underline"
            : "text-gray-200 hover:text-white hover:underline"
        }
      >
        {title}
      </Link>
      <span className="text-gray-500"> · {Math.round(distanceMeters)}m</span>
      {seen ? (
        <span className="ml-1 text-xs text-gray-600">seen</span>
      ) : null}
    </li>
  );
}
