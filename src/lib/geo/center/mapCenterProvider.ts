/** Reference adapter — not wired in UI. See docs/proximity-architecture.md */
import type {
  ProximityCenter,
  ProximityCenterProvider,
} from "./ProximityCenterProvider";

export class MapCenterProvider implements ProximityCenterProvider {
  constructor(private readonly readMapCenter: () => ProximityCenter | null) {}

  getCenter(): ProximityCenter | null {
    return this.readMapCenter();
  }
}

export function createMapCenterProvider(
  readMapCenter: () => ProximityCenter | null,
): MapCenterProvider {
  return new MapCenterProvider(readMapCenter);
}
