"use client";

import { usePathname } from "next/navigation";
import NotificationNavLink from "../notifications/NotificationNavLink";
import { useNotifications } from "../notifications/NotificationsProvider";
import { RealtimeDebug } from "../realtime/RealtimeDebug";

export default function SiteFooter() {
  const pathname = usePathname();
  const { loadNotifications } = useNotifications();

  return (
    <footer className="text-center text-xs text-gray-500 py-6 space-x-4 border-t border-gray-800 mt-10">
      <NotificationNavLink />
      <a href="/login" className="hover:text-gray-300">
        Login
      </a>
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
    </footer>
  );
}
