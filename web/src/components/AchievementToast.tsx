import { useEffect, useState } from "react";
import type { Achievement } from "../domain/achievements";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAchievements } from "../hooks/useAchievements";
import { ShareCardModal } from "./ShareCardModal";

const DISPLAY_MS = 4000;

// Monté une seule fois au niveau App (hors AppShell) pour rester visible
// quelle que soit la route — un badge peut se débloquer depuis le mode
// Préparation (fin de recette), qui n'a pas de coquille de navigation.
export function AchievementToast() {
  const { t } = useTranslation();
  const { newlyUnlocked, acknowledge } = useAchievements();
  const [visible, setVisible] = useState<Achievement[]>([]);
  const [shareTarget, setShareTarget] = useState<Achievement | null>(null);
  const newlyUnlockedKey = newlyUnlocked.map((a) => a.id).join(",");

  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    setVisible(newlyUnlocked);
    const ids = newlyUnlocked.map((a) => a.id);
    const timer = setTimeout(() => {
      acknowledge(ids);
      setVisible([]);
    }, DISPLAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyUnlockedKey]);

  return (
    <>
      {visible.length > 0 && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2"
          style={{ maxWidth: 360, width: "calc(100% - 32px)" }}
          role="status"
        >
          {visible.map((achievement) => (
            <div
              key={achievement.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg animate-fade-in"
              style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
            >
              <span style={{ fontSize: 24 }} aria-hidden>
                {achievement.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t("achievements.unlockedToast")}</p>
                <p className="text-sm font-bold truncate">{t(achievement.titleKey)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShareTarget(achievement)}
                aria-label={t("shareCard.shareAria")}
                className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{ width: 30, height: 30, background: "rgba(11,11,15,0.15)" }}
              >
                📤
              </button>
            </div>
          ))}
        </div>
      )}
      {shareTarget && (
        <ShareCardModal
          emoji={shareTarget.icon}
          title={t(shareTarget.titleKey)}
          subtitle={t("shareCard.achievementSubtitle")}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
