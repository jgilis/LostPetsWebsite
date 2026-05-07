"use client";

import { Marker } from "react-leaflet";

type Props = {
  cluster: any;
  onClick: (id: number, lat: number, lng: number) => void;
};

export default function ClusterMarker({ cluster, onClick }: Props) {
  const [lng, lat] = cluster.geometry.coordinates;

  const count = cluster.properties.point_count;

  return (
    <Marker
      position={[lat, lng]}
      eventHandlers={{
        click: () => onClick(cluster.id, lat, lng),
      }}
      icon={createClusterIcon(count)}
    />
  );
}

// simple visual cluster icon (temporary)
function createClusterIcon(count: number) {
  const size = Math.min(60, 28 + Math.log2(count + 1) * 12);
  const intensity = Math.min(0.75 + count / 200, 1);

  return new (require("leaflet").DivIcon)({
    className: "cluster-icon", // important: removes default white box styling
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background: rgba(107,114,128,${intensity});;
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:600;
        font-size:12px;
        border: 2px solid rgba(255,255,255,0.6);
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        transform: translate(-50%, -50%);
      ">
        ${count}
      </div>
    `,
  });
}