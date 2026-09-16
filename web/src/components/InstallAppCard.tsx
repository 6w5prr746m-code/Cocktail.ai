import { useEffect, useState } from "react";
import { isIOS, isRunningStandalone, useInstallPromptStore } from "../state/installPrompt";
import { useTranslation } from "../domain/i18n/useTranslation";

export function InstallAppCard() {
  const { deferredEvent, installed } = useInstallPromptStore();
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setStandalone(isRunningStandalone());
  }, [installed]);

  if (standalone || installed) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3 glass-card mb-6">
        <span className="text-xl">✓</span>
        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
          {t("installCard.installed")}
        </p>
      </div>
    );
  }

  if (dismissed) return null;

  if (deferredEvent) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-4 glass-card mb-6">
        <span className="text-2xl">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {t("installCard.title")}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t("installCard.body")}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await deferredEvent.prompt();
            await deferredEvent.userChoice;
          }}
          className="flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {t("installCard.installButton")}
        </button>
      </div>
    );
  }

  if (isIOS()) {
    return (
      <div className="rounded-2xl p-4 flex items-start gap-3 glass-card mb-6">
        <span className="text-2xl">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {t("installCard.iosTitle")}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {t("installCard.iosBody")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t("installCard.dismiss")}
          className="flex-shrink-0 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
