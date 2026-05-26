export type ProximityCenter = {
  lat: number;
  lng: number;
};

export type ProximityCenterProvider = {
  getCenter: () => ProximityCenter | null;
};
