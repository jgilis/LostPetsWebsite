export function applyLocationOffset(lat: number, lng: number) {
  const offset = 0.0005; // ~50m

  const latOffset = (Math.random() - 0.5) * offset;
  const lngOffset = (Math.random() - 0.5) * offset;

  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  };
}