"use client";

import SessionControls from "../auth/SessionControls";
import NotificationNavLink from "../notifications/NotificationNavLink";
import PushNotificationControls from "../notifications/PushNotificationControls";
import { useNotifications } from "../notifications/NotificationsProvider";
import { RealtimeDebug } from "../realtime/RealtimeDebug";
import PwaInstallButton from "../pwa/PwaInstallButton";

export default function SiteFooter() {
  const { loadNotifications } = useNotifications();

  return (
    <footer className="mt-10 border-t border-gray-800 py-6 text-center">
      <nav
        aria-label="Main navigation"
        className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
      >
        <a
          href="/"
          className="font-medium text-gray-300 hover:text-white"
        >
          Home / Map
        </a>
        <a
          href="/?tab=report"
          className="font-medium text-gray-300 hover:text-white"
        >
          Report
        </a>
        <NotificationNavLink />
      </nav>

      <div
        aria-label="App actions"
        className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400"
      >
        <PwaInstallButton />
        <PushNotificationControls />
        <SessionControls />
      </div>

      <nav
        aria-label="Legal"
        className="flex flex-wrap items-center justify-center gap-x-4 text-[11px] text-gray-500"
      >
        <a href="/about" className="hover:text-gray-300">
          About
        </a>
        <a href="/privacy" className="hover:text-gray-300">
          Privacy Policy
        </a>
        <a href="/terms" className="hover:text-gray-300">
          Terms of Use
        </a>
      </nav>

      <RealtimeDebug
        hideUi
        onInsert={() => {
          void loadNotifications();
        }}
      />
    </footer>
  );
}
