"use client";

import { useTranslation } from "@/src/i18n/I18nProvider";

type WalkingModeExitBarProps = {
  visible: boolean;
  onExit: () => void;
};

export default function WalkingModeExitBar({
  visible,
  onExit,
}: WalkingModeExitBarProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div className="walking-mode-exit-bar fixed inset-x-0 top-0 z-[560] border-b border-amber-700/80 bg-gray-900 md:hidden">
      <button
        type="button"
        onClick={onExit}
        className="flex min-h-[44px] w-full items-center justify-center px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-gray-800"
      >
        {t("walkingModeExit")}
      </button>
    </div>
  );
}
