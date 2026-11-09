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
      className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 font-medium text-gray-300 hover:text-white md:h-auto md:min-w-0"
      aria-label={t("navNotifications")}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-5 w-5 md:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
        />
      </svg>
      <span className="hidden md:inline">{t("navNotifications")}</span>
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
