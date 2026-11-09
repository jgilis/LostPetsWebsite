"use client";

import { useState } from "react";
import { signOut } from "@/src/lib/auth";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function SessionControls() {
  const { user, loading } = useCurrentUser();
  const { t } = useTranslation();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    window.location.href = "/";
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex h-11 min-w-11 items-center justify-center text-gray-400 hover:text-gray-200 md:h-auto md:min-w-0 md:underline"
        aria-label={t("navAccount")}
      >
        <AccountIcon />
        <span className="hidden md:inline">{t("navAccount")}</span>
      </a>
    );
  }

  const email = user.email ?? t("sessionSignedIn");

  return (
    <details className="group relative text-left">
      <summary
        className="inline-flex h-11 min-w-11 cursor-pointer list-none items-center justify-center text-gray-400 hover:text-gray-200 md:h-auto md:min-w-0 md:underline [&::-webkit-details-marker]:hidden"
        aria-label={t("navAccount")}
      >
        <AccountIcon />
        <span className="hidden md:inline">{t("navAccount")}</span>
      </summary>
      <div className="absolute top-full right-0 z-10 mt-2 min-w-[12rem] max-w-[16rem] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-left shadow-lg md:left-1/2 md:right-auto md:-translate-x-1/2">
        <p className="mb-2 truncate text-xs text-gray-400" title={email}>
          {email}
        </p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          className="w-full text-left text-gray-300 underline hover:text-white disabled:opacity-50"
        >
          {signingOut ? t("sessionLoggingOut") : t("sessionLogout")}
        </button>
      </div>
    </details>
  );
}

function AccountIcon() {
  return (
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
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
      />
    </svg>
  );
}
