"use client";

import { useMapEvents } from "react-leaflet";

const PADDING = {
  top: 16,
  right: 16,
  bottom: 20,
  left: 16,
};

export default function PopupViewGuard() {
  useMapEvents({
    popupopen(e) {
      const map = e.target;
      const popup = e.popup;
      const el = popup.getElement();

      if (!el) return;

      const fitPopupInMap = () => {
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

      requestAnimationFrame(() => {
        requestAnimationFrame(fitPopupInMap);
      });

      window.setTimeout(fitPopupInMap, 50);
      window.setTimeout(fitPopupInMap, 300);
    },
  });

  return null;
}
