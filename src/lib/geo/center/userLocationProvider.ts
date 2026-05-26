import type {
  ProximityCenter,
  ProximityCenterProvider,
} from "./ProximityCenterProvider";

export class UserLocationProvider implements ProximityCenterProvider {
  constructor(private readonly readUserLocation: () => ProximityCenter | null) {}

  getCenter(): ProximityCenter | null {
    return this.readUserLocation();
  }
}

export function createUserLocationProvider(
  readUserLocation: () => ProximityCenter | null,
): UserLocationProvider {
  return new UserLocationProvider(readUserLocation);
}
