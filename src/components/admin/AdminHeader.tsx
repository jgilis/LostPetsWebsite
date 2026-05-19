"use client";

import Link from "next/link";
import { signOut } from "@/src/lib/auth";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";

type AdminHeaderProps = {
  title?: string;
  showBackLink?: boolean;
};

export default function AdminHeader({
  title,
  showBackLink = false,
}: AdminHeaderProps) {
  const { user } = useCurrentUser();
  const { t } = useTranslation();
  const heading = title ?? t("adminPanel");

  return (
    <header className="mb-8 border-b border-gray-800 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{heading}</h1>
          {user?.email && (
            <p className="mt-1 text-sm text-gray-400">
              {t("adminLoggedInAs")} {user.email}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:border-gray-500 hover:bg-gray-800"
        >
          {t("sessionLogout")}
        </button>
      </div>
      {showBackLink && (
        <Link
          href="/admin"
          className="mt-3 inline-block text-sm text-gray-400 hover:text-gray-200"
        >
          ← {t("adminHome")}
        </Link>
      )}
    </header>
  );
}
