"use client";

import { useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import type { Map as LeafletMap, Popup } from "leaflet";

const PADDING = {
  top: 16,
  right: 16,
  bottom: 20,
  left: 16,
};

function isMapAlive(map: LeafletMap): boolean {
  const container = map.getContainer();
  return !!container?.isConnected;
}

function isPopupAlive(popup: Popup): boolean {
  const el = popup.getElement();
  return !!el?.isConnected;
}

export default function PopupViewGuard() {
  const cancelPendingRef = useRef<(() => void) | null>(null);

  const cancelPending = () => {
    cancelPendingRef.current?.();
    cancelPendingRef.current = null;
  };

  useEffect(() => cancelPending, []);

  useMapEvents({
    popupopen(e) {
      cancelPending();

      const map = e.target;
      const popup = e.popup;

      const fitPopupInMap = () => {
        if (!isMapAlive(map) || !isPopupAlive(popup)) return;

        const el = popup.getElement();
        if (!el) return;

        const container = map.getContainer();
        const cRect = container.getBoundingClientRect();
        const pRect = el.getBoundingClientRect();

        let panX = 0;
        let panY = 0;

        if (pRect.top < cRect.top + PADDING.top) {
          panY = pRect.top - (cRect.top + PADDING.top);
        } else if (pRect.bottom > cRect.bottom - PADDING.bottom) {
          panY = pRect.bottom - (cRect.bottom - PADDING.bottom);
        }

        if (pRect.left < cRect.left + PADDING.left) {
          panX = pRect.left - (cRect.left + PADDING.left);
        } else if (pRect.right > cRect.right - PADDING.right) {
          panX = pRect.right - (cRect.right - PADDING.right);
        }

        if (panX !== 0 || panY !== 0) {
          map.panBy([panX, panY], { animate: true, duration: 0.25 });
        }

        const body = el.querySelector(".report-popup-body");
        if (body instanceof HTMLElement) {
          body.scrollTop = 0;
        }
      };

      let rafOuter = 0;
      let rafInner = 0;
      const timeoutIds: number[] = [];

      rafOuter = window.requestAnimationFrame(() => {
        rafInner = window.requestAnimationFrame(fitPopupInMap);
      });

      timeoutIds.push(window.setTimeout(fitPopupInMap, 50));
      timeoutIds.push(window.setTimeout(fitPopupInMap, 300));

      cancelPendingRef.current = () => {
        window.cancelAnimationFrame(rafOuter);
        window.cancelAnimationFrame(rafInner);
        for (const id of timeoutIds) {
          window.clearTimeout(id);
        }
      };
    },
    popupclose() {
      cancelPending();
    },
  });

  return null;
}
