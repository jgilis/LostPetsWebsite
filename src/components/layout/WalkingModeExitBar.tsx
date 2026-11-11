"use client";

import { useTranslation } from "@/src/i18n/I18nProvider";

type WalkingModeExitBarProps = {
  visible: boolean;
  onExit: () => void;
  statusLabel?: string | null;
};

export default function WalkingModeExitBar({
  visible,
  onExit,
  statusLabel,
}: WalkingModeExitBarProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div className="walking-mode-exit-bar fixed inset-x-0 top-0 z-[560] border-b border-lp-gold/70 bg-lp-gold-soft pt-[env(safe-area-inset-top)] md:hidden">
      <button
        type="button"
        onClick={onExit}
        className="flex min-h-[44px] w-full items-center justify-center px-4 py-2 text-sm font-semibold text-lp-ink hover:bg-lp-gold/30"
      >
        {t("walkingModeExit")}
      </button>
      {statusLabel ? (
        <p className="px-4 pb-2 text-center text-xs text-lp-ink-muted" role="status">
          {statusLabel}
        </p>
      ) : null}
    </div>
  );
}
