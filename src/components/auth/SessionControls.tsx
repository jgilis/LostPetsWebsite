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
        className="text-gray-400 underline hover:text-gray-200"
      >
        {t("navAccount")}
      </a>
    );
  }

  const email = user.email ?? t("sessionSignedIn");

  return (
    <details className="group relative text-left">
      <summary className="cursor-pointer list-none text-gray-400 underline hover:text-gray-200 [&::-webkit-details-marker]:hidden">
        {t("navAccount")}
      </summary>
      <div className="absolute bottom-full left-1/2 z-10 mb-2 min-w-[12rem] max-w-[16rem] -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-left shadow-lg">
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
