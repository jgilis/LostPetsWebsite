"use client";

import Link from "next/link";
import { useTranslation } from "@/src/i18n/I18nProvider";
import {
  homeDestinationHref,
  type HomeDestination,
} from "@/src/lib/homeDestination";
import type { TranslationKey } from "@/src/i18n/types";
import {
  ActivityIcon,
  DiscoverIcon,
  ReportIcon,
} from "@/src/components/icons/NavIcons";

const DESTINATIONS: {
  id: HomeDestination;
  label: TranslationKey;
  icon: typeof DiscoverIcon;
}[] = [
  { id: "discover", label: "tabDiscover", icon: DiscoverIcon },
  { id: "activity", label: "tabActivity", icon: ActivityIcon },
  { id: "report", label: "tabReport", icon: ReportIcon },
];

type DiscoverDestinationNavProps = {
  destination: HomeDestination;
};

export default function DiscoverDestinationNav({
  destination,
}: DiscoverDestinationNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("discoverNavLabel")}
      className="discover-nav fixed inset-x-0 bottom-0 z-[550] border-t border-lp-line bg-lp-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(61_52_44_/_0.06)] backdrop-blur-md md:bottom-auto md:top-0 md:border-t-0 md:border-b md:pb-0 md:shadow-none"
    >
      <div className="mx-auto flex max-w-6xl">
        {DESTINATIONS.map(({ id, label, icon: Icon }) => {
          const selected = destination === id;
          return (
            <Link
              key={id}
              href={homeDestinationHref(id)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-2 py-3 text-sm transition ${
                selected
                  ? "font-semibold text-lp-sage-dark md:border-b-2 md:border-lp-sage"
                  : "text-lp-ink-muted hover:text-lp-ink"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{t(label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
