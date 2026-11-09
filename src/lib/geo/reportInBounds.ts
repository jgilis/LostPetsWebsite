export type MapBoundsBox = [west: number, south: number, east: number, north: number];

export function reportInBounds(
  report: { latitude: number; longitude: number },
  bounds: MapBoundsBox,
): boolean {
  const [west, south, east, north] = bounds;
  return (
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    report.latitude >= south &&
    report.latitude <= north &&
    report.longitude >= west &&
    report.longitude <= east
  );
}

export function filterReportsInBounds<
  T extends { latitude: number; longitude: number },
>(reports: T[], bounds: MapBoundsBox | null): T[] {
  if (!bounds) return [];
  return reports.filter((report) => reportInBounds(report, bounds));
}

export function centerFromBounds(
  bounds: MapBoundsBox | null,
): { lat: number; lng: number } | null {
  if (!bounds) return null;
  const [west, south, east, north] = bounds;
  return {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
  };
}
