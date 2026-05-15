"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useNotifications } from "./NotificationsProvider";

export default function NotificationNavLink() {
  const pathname = usePathname();
  const { unreadCount, loadNotifications } = useNotifications();

  useEffect(() => {
    void loadNotifications();
    const onFocus = () => {
      void loadNotifications();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname, loadNotifications]);

  return (
    <Link
      href="/notifications"
      className="hover:text-gray-300 inline-flex items-center gap-1.5"
    >
      Notifications
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
