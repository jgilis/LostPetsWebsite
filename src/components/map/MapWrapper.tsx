"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./mapTypes";

const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapWrapper(props: MapProps) {
  return <Map {...props} />;
}