"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
};

export default function PopupPhoto({ src, alt }: Props) {
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    if (!enlarged) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnlarged(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlarged]);

  return (
    <>
      <button
        type="button"
        className="report-popup-photo-btn"
        onClick={() => setEnlarged(true)}
        aria-label={`Enlarge photo of ${alt}`}
      >
        <img src={src} alt={alt} />
        <span className="report-popup-photo-hint">Tap to enlarge</span>
      </button>

      {enlarged && (
        <div
          className="report-popup-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged photo of ${alt}`}
          onClick={() => setEnlarged(false)}
        >
          <button
            type="button"
            className="report-popup-lightbox-close"
            onClick={() => setEnlarged(false)}
            aria-label="Close enlarged photo"
          >
            ×
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
