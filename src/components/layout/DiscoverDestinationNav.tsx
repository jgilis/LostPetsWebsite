"use client";

import Link from "next/link";
import { useTranslation } from "@/src/i18n/I18nProvider";
import {
  homeDestinationHref,
  type HomeDestination,
} from "@/src/lib/homeDestination";
import type { TranslationKey } from "@/src/i18n/types";

const DESTINATIONS: {
  id: HomeDestination;
  label: TranslationKey;
}[] = [
  { id: "discover", label: "tabDiscover" },
  { id: "activity", label: "tabActivity" },
  { id: "report", label: "tabReport" },
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
      className="discover-nav fixed inset-x-0 bottom-0 z-[550] border-t border-gray-800 bg-gray-950 pb-[env(safe-area-inset-bottom)] md:bottom-auto md:top-0 md:border-t-0 md:border-b md:pb-0"
    >
      <div className="mx-auto flex max-w-6xl">
        {DESTINATIONS.map(({ id, label }) => {
          const selected = destination === id;
          return (
            <Link
              key={id}
              href={homeDestinationHref(id)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-[44px] flex-1 items-center justify-center px-2 py-3 text-sm transition ${
                selected
                  ? "font-semibold text-white md:border-b-2 md:border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t(label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
