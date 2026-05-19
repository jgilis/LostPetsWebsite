"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useNotifications } from "./NotificationsProvider";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function NotificationNavLink() {
  const pathname = usePathname();
  const { unreadCount, loadNotifications } = useNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    void loadNotifications();
  }, [pathname, loadNotifications]);

  return (
    <Link
      href="/notifications"
      className="inline-flex items-center gap-1.5 font-medium text-gray-300 hover:text-white"
    >
      {t("navNotifications")}
      {unreadCount > 0 && (
        <span
          className="inline-flex min-w-[1.1rem] h-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
          aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
