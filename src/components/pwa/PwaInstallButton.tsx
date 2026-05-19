"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/src/hooks/usePwaInstall";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function PwaInstallButton() {
  const { canInstall, installing, install } = usePwaInstall();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={installing}
      className="text-gray-400 underline hover:text-gray-200 disabled:opacity-50"
    >
      {installing ? t("pwaInstalling") : `${t("pwaInstall")} 📱`}
    </button>
  );
}
