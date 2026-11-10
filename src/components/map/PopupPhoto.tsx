"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  alt: string;
  layout?: "popup" | "detail";
  hint?: string;
  onError?: () => void;
};

export default function PopupPhoto({
  src,
  alt,
  layout = "popup",
  hint = "Tap to enlarge",
  onError,
}: Props) {
  const [enlarged, setEnlarged] = useState(false);
  const isDetail = layout === "detail";

  useEffect(() => {
    if (!enlarged) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setEnlarged(false);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enlarged]);

  const lightbox =
    enlarged && typeof document !== "undefined"
      ? createPortal(
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
            <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={
          isDetail
            ? "block w-full cursor-zoom-in text-left"
            : "report-popup-photo-btn"
        }
        onClick={() => setEnlarged(true)}
        aria-label={`Enlarge photo of ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={
            isDetail
              ? "w-full max-h-80 rounded-lg border border-gray-700 object-cover"
              : undefined
          }
          onError={onError}
        />
        <span
          className={
            isDetail
              ? "mt-1.5 block text-xs text-gray-500"
              : "report-popup-photo-hint"
          }
        >
          {hint}
        </span>
      </button>
      {lightbox}
    </>
  );
}
