"use client";

import { useState } from "react";
import "leaflet/dist/leaflet.css";
import useLeaflet from "../../hooks/useLeaflet";
import LocationPicker from "../report/LocationPicker";
import { isOutOfMechelen } from "../../lib/mechelenBounds";

type Props = {
  lostReportId: string;
  onClose: () => void;
};

export default function SightingModal({ lostReportId, onClose }: Props) {
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"gps" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const L = useLeaflet();
  const isValid = !!lat && !!lng && !loading;
  const outOfArea =
    lat != null && lng != null && isOutOfMechelen(lat, lng);

  // -----------------------
  // GPS location
  // -----------------------
  const useGPS = () => {
    setMode("gps");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        setError("Could not get location. Please use manual mode.");
        setMode(null);
      }
    );
  };

  // -----------------------
  // Manual map click handler (simple version)
  // -----------------------
  const handleMapClick = (e: any) => {
    setLat(e.latlng.lat);
    setLng(e.latlng.lng);
  };

  // -----------------------
  // Submit sighting
  // -----------------------
  const submit = async () => {
    if (!lat || !lng) {
      setError("Please set a location first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/smooth-processor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lost_report_id: lostReportId,
            latitude: lat,
            longitude: lng,
            description,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit");
      }

      alert("Sighting submitted!");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "95%",
          maxWidth: "720px",
          minWidth: "320px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "12px",
            letterSpacing: "-0.2px",
          }}
        >
          Report a sighting
        </h2>

        {/* LOCATION MODE */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <button
            onClick={useGPS}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f3f4f6",
              cursor: "pointer",
            }}
          >
            📍 Use my location
          </button>

          <button
            onClick={() => setMode("manual")}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f3f4f6",
              cursor: "pointer",
            }}
          >
            🗺 Pick on map
          </button>
        </div>

        {/* REAL MAP PICKER */}
        {mode === "manual" && (
          <div style={{ marginTop: "10px" }}>
            <LocationPicker
              latitude={lat ?? 51.025}
              longitude={lng ?? 4.477}
              setLatitude={setLat}
              setLongitude={setLng}
            />
          </div>
        )}

        {/* SELECTED LOCATION */}
        {lat && lng && (
          <p>
            📍 {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}

        {outOfArea && (
          <p
            style={{
              color: "#b45309",
              fontSize: "14px",
              marginTop: "8px",
              marginBottom: 0,
            }}
          >
            ⚠ Coordinates are outside the usual Mechelen area. Admins will
            review.
          </p>
        )}

        {/* DESCRIPTION */}
        <textarea
          placeholder="What did you see?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />

        {/* ERROR */}
        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
            gap: "10px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f3f4f6",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!isValid}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              background: !isValid ? "#9ca3af" : "#2563eb",
              color: "white",
              cursor: !isValid ? "not-allowed" : "pointer",
              flex: 1,
            }}
          >
            {loading ? "Submitting..." : "Submit sighting"}
          </button>
        </div>
      </div>
    </div>
  );
}