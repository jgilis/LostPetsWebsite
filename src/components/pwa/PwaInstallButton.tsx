"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/src/hooks/usePwaInstall";

export default function PwaInstallButton() {
  const { canInstall, installing, install } = usePwaInstall();
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
      {installing ? "Installing…" : "Install App 📱"}
    </button>
  );
}
