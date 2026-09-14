import { useEffect, useState } from "react";
import { isIOS, isRunningStandalone, useInstallPromptStore } from "../state/installPrompt";

export function InstallAppCard() {
  const { deferredEvent, installed } = useInstallPromptStore();
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setStandalone(isRunningStandalone());
  }, [installed]);

  if (standalone || installed) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3 glass-card mb-6">
        <span className="text-xl">✓</span>
        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
          App installée — merci !
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
            Installer Cocktail.ai
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Lance l'app directement depuis ton écran d'accueil, même hors ligne.
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
          Installer
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
            Installer sur iPhone/iPad
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Appuie sur <strong>Partager</strong> (⬆️) dans Safari, puis <strong>"Sur l'écran d'accueil"</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Masquer"
          className="flex-shrink-0 text-sm opacity-60"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
