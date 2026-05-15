"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../../lib/notifications";

export default function NotificationNavLink() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const unread = await getUnreadNotificationCount();
      if (active) setCount(unread);
    };

    refresh();
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  return (
    <Link
      href="/notifications"
      className="hover:text-gray-300 inline-flex items-center gap-1.5"
    >
      Notifications
      {count > 0 && (
        <span
          className="inline-flex min-w-[1.1rem] h-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
          aria-label={`${count} unread notification${count === 1 ? "" : "s"}`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
