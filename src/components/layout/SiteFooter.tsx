"use client";

import { usePathname } from "next/navigation";
import SessionControls from "../auth/SessionControls";
import NotificationNavLink from "../notifications/NotificationNavLink";
import { useNotifications } from "../notifications/NotificationsProvider";
import { RealtimeDebug } from "../realtime/RealtimeDebug";

export default function SiteFooter() {
  const pathname = usePathname();
  const { loadNotifications } = useNotifications();

  return (
    <footer className="text-center text-xs text-gray-500 py-6 border-t border-gray-800 mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <a href="/" className="font-medium text-gray-300 hover:text-white">
          Home / Map
        </a>
        <a
          href="/?tab=report"
          className="font-medium text-gray-300 hover:text-white"
        >
          Report
        </a>
        <SessionControls />
        <NotificationNavLink />
      </div>
      <div className="space-x-4">
      <a href="/about" className="hover:text-gray-300">
        About
      </a>
      <a href="/privacy" className="hover:text-gray-300">
        Privacy Policy
      </a>
      <a href="/terms" className="hover:text-gray-300">
        Terms of Use
      </a>

      <RealtimeDebug
        hideUi={pathname !== "/notifications"}
        onInsert={() => {
          void loadNotifications();
        }}
      />
      </div>
    </footer>
  );
}
