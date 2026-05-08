import { Circle } from "react-leaflet";
import { Report } from "../report/useReports";

type AnimalType = Report["animal_type"];

type Props = {
  reports: Report[];
  enabled: boolean;
  getColor: (type: AnimalType) => string;
};

export default function CirclesLayer({
  reports,
  enabled,
  getColor,
}: Props) {
  if (!enabled) return null;

  return (
    <>
      {reports.map((r) => (
        <Circle
          key={`circle-${r.id}`}
          center={[r.latitude, r.longitude]}
          radius={100}
          pane="overlayPane"
          pathOptions={{
            color: getColor(r.animal_type),
            fillColor: getColor(r.animal_type),
            fillOpacity: 0.12,
            weight: 1,
          }}
        />
      ))}
    </>
  );
}