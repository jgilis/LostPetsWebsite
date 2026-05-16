"use client";

import { useEffect, useState } from "react";

type AdminReportThumbnailProps = {
  src: string;
  alt: string;
};

export default function AdminReportThumbnail({
  src,
  alt,
}: AdminReportThumbnailProps) {
  const [enlarged, setEnlarged] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!enlarged) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEnlarged(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlarged]);

  if (broken) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-600 bg-gray-800 hover:border-gray-500"
        aria-label={`View photo of ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </button>

      {enlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged photo of ${alt}`}
          onClick={() => setEnlarged(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md border border-gray-600 bg-gray-900 px-3 py-1 text-sm text-gray-200 hover:bg-gray-800"
            onClick={() => setEnlarged(false)}
            aria-label="Close enlarged photo"
          >
            Close
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
