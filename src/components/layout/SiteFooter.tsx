"use client";

import SessionControls from "../auth/SessionControls";
import NotificationNavLink from "../notifications/NotificationNavLink";
import PushNotificationControls from "../notifications/PushNotificationControls";
import { useNotifications } from "../notifications/NotificationsProvider";
import { RealtimeDebug } from "../realtime/RealtimeDebug";
import PwaInstallButton from "../pwa/PwaInstallButton";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function SiteFooter() {
  const { loadNotifications } = useNotifications();
  const { t } = useTranslation();

  return (
    <footer className="mt-10 border-t border-lp-line py-6 text-center text-lp-ink">
      <nav
        aria-label="Main navigation"
        className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
      >
        <a
          href="/?tab=discover"
          className="font-medium text-lp-ink-muted hover:text-lp-ink"
        >
          {t("navHomeMap")}
        </a>
        <a
          href="/?tab=report"
          className="font-medium text-lp-ink-muted hover:text-lp-ink"
        >
          {t("navReport")}
        </a>
        <NotificationNavLink />
      </nav>

      <div
        aria-label="App actions"
        className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-lp-ink-muted"
      >
        <LanguageSwitcher />
        <PwaInstallButton />
        <PushNotificationControls />
        <SessionControls />
      </div>

      <nav
        aria-label="Legal"
        className="flex flex-wrap items-center justify-center gap-x-4 text-[11px] text-lp-ink-subtle"
      >
          <a href="/about" className="hover:text-lp-ink">
          {t("navAbout")}
        </a>
          <a href="/privacy" className="hover:text-lp-ink">
          {t("navPrivacy")}
        </a>
          <a href="/terms" className="hover:text-lp-ink">
          {t("navTerms")}
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
