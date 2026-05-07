"use client";

import { useMemo } from "react";
import Supercluster from "supercluster";
import type { Report } from "./useReports";

type ClusterFeature = {
  type: "Feature";
  properties: {
    cluster: boolean;
    report?: Report;
    point_count?: number;
    cluster_id?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type Bounds = [number, number, number, number];

export function useSupercluster({
  reports,
  zoom,
  bounds,
}: {
  reports: Report[];
  zoom: number;
  bounds: Bounds | null;
}) {
  // 1. Convert reports → GeoJSON
  const points: ClusterFeature[] = useMemo(() => {
    return reports.map((r) => ({
      type: "Feature",
      properties: {
        cluster: false,
        report: r,
      },
      geometry: {
        type: "Point",
        coordinates: jitterCoords(r.longitude, r.latitude, r.id),
      },
    }));
  }, [reports]);

  // 2. Create index
  const index = useMemo(() => {
    const supercluster = new Supercluster({
      radius: 50,
      maxZoom: 20,
    });

    supercluster.load(points as any);
    return supercluster;
  }, [points]);

  // 3. Get visible data
  const clusters = useMemo(() => {
    if (!bounds) return [];

    return index.getClusters(bounds, zoom);
  }, [index, bounds, zoom]);

  return {
    clusters,
    index,
  };
}

function jitterCoords(lng: number, lat: number, seed: string) {
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);

  const jitter = (hash % 100) * 0.00001;

  return [lng + jitter, lat - jitter] as [number, number];
}