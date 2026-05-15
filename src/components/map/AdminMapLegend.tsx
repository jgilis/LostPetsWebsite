type LegendItem = {
  label: string;
  marker: "blue-pin" | "red-pin" | "red-dot";
};

const items: LegendItem[] = [
  { label: "Original report", marker: "blue-pin" },
  { label: "Current sighting", marker: "red-pin" },
  { label: "Past sighting", marker: "red-dot" },
];

function LegendMarker({ marker }: { marker: LegendItem["marker"] }) {
  if (marker === "red-dot") {
    return (
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: "#dc2626",
          border: "2px solid #ffffff",
          boxShadow: "0 0 0 1px #dc2626",
          flexShrink: 0,
        }}
      />
    );
  }

  const iconUrl =
    marker === "blue-pin"
      ? "/leaflet/marker-icon-blue.png"
      : "/leaflet/marker-icon-red.png";

  return (
    <img
      src={iconUrl}
      alt=""
      width={18}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

export default function AdminMapLegend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        color: "#111827",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "12px",
        lineHeight: 1.4,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: "8px",
          fontSize: "13px",
        }}
      >
        Map legend
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {items.map((item) => (
          <li
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LegendMarker marker={item.marker} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
