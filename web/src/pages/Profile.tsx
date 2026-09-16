import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllCocktails } from "../domain/catalog";
import { computeHistoryStats } from "../domain/historyStats";
import { useHistoryStore } from "../state/history";
import { useThemeStore, applyThemeToDocument, type ThemePreference } from "../state/theme";
import { useFavoritesStore } from "../state/favorites";
import { useMyBarStore } from "../state/myBar";
import { useUserRecipesStore } from "../state/userRecipes";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { InstallAppCard } from "../components/InstallAppCard";
import { ShareCardModal } from "../components/ShareCardModal";
import { useAchievements } from "../hooks/useAchievements";
import { isSkinUnlocked, SKINS } from "../domain/cosmetics";
import { useCosmeticsStore } from "../state/cosmetics";
import { SUPPORT_URL } from "../domain/supportLink";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocaleStore, type Locale } from "../state/locale";
import type { TranslationKey } from "../domain/i18n/useTranslation";

const THEME_OPTIONS: { value: ThemePreference; labelKey: TranslationKey }[] = [
  { value: "system", labelKey: "profile.themeSystem" },
  { value: "light", labelKey: "profile.themeLight" },
  { value: "dark", labelKey: "profile.themeDark" },
];

const LANGUAGE_OPTIONS: { value: Locale; labelKey: TranslationKey }[] = [
  { value: "fr", labelKey: "profile.languageFr" },
  { value: "en", labelKey: "profile.languageEn" },
];

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const cocktails = useAllCocktails();
  const history = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clear);
  const { preference, setPreference } = useThemeStore();
  const { all: allAchievements, unlockedIds } = useAchievements();
  const [shareAchievement, setShareAchievement] = useState<(typeof allAchievements)[number] | null>(null);
  const skinId = useCosmeticsStore((s) => s.skinId);
  const setSkin = useCosmeticsStore((s) => s.setSkin);

  const sortedHistory = [...history].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const stats = useMemo(() => computeHistoryStats(history, cocktails), [history, cocktails]);

  function resetAllData() {
    if (!confirm(t("profile.resetConfirm"))) return;
    clearHistory();
    useFavoritesStore.persist.clearStorage();
    useMyBarStore.persist.clearStorage();
    useUserRecipesStore.persist.clearStorage();
    window.location.reload();
  }

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      {shareAchievement && (
        <ShareCardModal
          emoji={shareAchievement.icon}
          title={t(shareAchievement.titleKey)}
          subtitle={t("shareCard.achievementSubtitle")}
          onClose={() => setShareAchievement(null)}
        />
      )}
      <h1 className="text-2xl font-bold px-4 pt-6 pb-4" style={{ color: "var(--color-text-primary)" }}>
        {t("profile.title")}
      </h1>

      <div className="px-4">
        <InstallAppCard />
      </div>

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          {t("profile.appearanceTitle")}
        </h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPreference(opt.value);
                applyThemeToDocument(opt.value);
              }}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{
                background: preference === opt.value ? "var(--color-accent-gold)" : "var(--color-surface)",
                color: preference === opt.value ? "#0b0b0f" : "var(--color-text-primary)",
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          {t("profile.languageTitle")}
        </h2>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLocale(opt.value)}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{
                background: locale === opt.value ? "var(--color-accent-gold)" : "var(--color-surface)",
                color: locale === opt.value ? "#0b0b0f" : "var(--color-text-primary)",
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("profile.proToolsTitle")}
        </h2>
        <div className="flex flex-col gap-2">
          <Link to="/costing" className="flex items-center gap-3 rounded-2xl p-3 glass-card transition-transform active:scale-[0.98]">
            <span style={{ fontSize: 24 }} aria-hidden>
              💰
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {t("profile.proToolsCostingTitle")}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {t("profile.proToolsCostingSubtitle")}
              </p>
            </div>
            <span className="flex-shrink-0 text-xl" aria-hidden>
              →
            </span>
          </Link>
          <Link to="/menu-builder" className="flex items-center gap-3 rounded-2xl p-3 glass-card transition-transform active:scale-[0.98]">
            <span style={{ fontSize: 24 }} aria-hidden>
              📋
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {t("profile.proToolsMenuTitle")}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {t("profile.proToolsMenuSubtitle")}
              </p>
            </div>
            <span className="flex-shrink-0 text-xl" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </section>

      {stats.totalCount > 0 && (
        <section className="px-4 pb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("profile.statisticsTitle")}
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <StatTile label={t("profile.prepared")} value={String(stats.totalCount)} />
            <StatTile label={t("profile.thisMonth")} value={String(stats.monthlyCount)} />
            <StatTile
              label={stats.currentStreakDays > 0 ? t("profile.currentStreak") : t("profile.bestStreak")}
              value={t("profile.daysUnit", { count: stats.currentStreakDays > 0 ? stats.currentStreakDays : stats.longestStreakDays })}
              emphasis={stats.currentStreakDays > 0}
            />
          </div>
          {stats.mostPrepared && (
            <Link
              to={`/cocktail/${stats.mostPrepared.cocktail.id}`}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: "var(--color-surface)" }}
            >
              <MiniGlassBadge cocktail={stats.mostPrepared.cocktail} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                  {stats.mostPrepared.cocktail.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t("profile.favoriteCocktailSubtitle", { count: stats.mostPrepared.count })}
                </p>
              </div>
            </Link>
          )}
        </section>
      )}

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("cosmetics.title")}
        </h2>
        <div className="flex gap-3 flex-wrap">
          {SKINS.map((skin) => {
            const unlocked = isSkinUnlocked(skin, unlockedIds.size);
            const selected = skinId === skin.id;
            return (
              <button
                key={skin.id}
                type="button"
                disabled={!unlocked}
                onClick={() => setSkin(skin.id)}
                title={unlocked ? t(skin.labelKey) : t("cosmetics.lockedHint", { count: skin.unlockBadgeCount })}
                className="flex flex-col items-center gap-1 rounded-2xl p-2"
                style={{ opacity: unlocked ? 1 : 0.45 }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    background: skin.previewColor,
                    boxShadow: selected ? `0 0 0 3px var(--color-bg), 0 0 0 5px ${skin.previewColor}` : undefined,
                  }}
                  aria-hidden
                />
                <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {unlocked ? t(skin.labelKey) : "🔒"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("achievements.title")}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {allAchievements.map((achievement) => {
            const unlocked = unlockedIds.has(achievement.id);
            return (
              <button
                key={achievement.id}
                type="button"
                disabled={!unlocked}
                onClick={() => setShareAchievement(achievement)}
                title={`${t(achievement.titleKey)} — ${t(achievement.descKey)}`}
                className="relative rounded-2xl p-3 flex flex-col items-center text-center gap-1"
                style={{ background: "var(--color-surface)", opacity: unlocked ? 1 : 0.4 }}
              >
                {unlocked && (
                  <span className="absolute top-1.5 right-1.5 text-xs" aria-hidden>
                    📤
                  </span>
                )}
                <span style={{ fontSize: 26, filter: unlocked ? undefined : "grayscale(1)" }} aria-hidden>
                  {achievement.icon}
                </span>
                <p className="text-[11px] font-medium leading-tight" style={{ color: "var(--color-text-primary)" }}>
                  {t(achievement.titleKey)}
                </p>
                <span className="sr-only">
                  {unlocked ? `${t(achievement.descKey)} — ${t("shareCard.shareAria")}` : t("achievements.lockedAria")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("profile.historyTitle")}
        </h2>
        {sortedHistory.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("profile.historyEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedHistory.map((entry) => {
              const cocktail = cocktails.find((c) => c.id === entry.cocktailId);
              if (!cocktail) return null;
              return (
                <li key={entry.id}>
                  <Link
                    to={`/cocktail/${cocktail.id}`}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: "var(--color-surface)" }}
                  >
                    <MiniGlassBadge cocktail={cocktail} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                        {cocktail.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(entry.completedAt).toLocaleString(locale === "en" ? "en-US" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {SUPPORT_URL && (
        <section className="px-4 pb-6">
          <div className="rounded-2xl p-4 glass-card">
            <p className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {t("profile.supportTitle")}
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
              {t("profile.supportBody")}
            </p>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full rounded-2xl py-3 font-semibold text-sm"
              style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
            >
              {t("profile.supportButton")}
            </a>
          </div>
        </section>
      )}

      <section className="px-4">
        <button
          type="button"
          onClick={resetAllData}
          className="w-full rounded-xl py-3 text-sm font-medium"
          style={{ background: "var(--color-surface)", color: "var(--color-danger-text)" }}
        >
          {t("profile.resetButton")}
        </button>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {t("profile.storageNote")}
        </p>
      </section>
    </div>
  );
}

function StatTile({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: "var(--color-surface)" }}>
      <p
        className="text-xl font-bold"
        style={{ color: emphasis ? "var(--color-accent-gold-text)" : "var(--color-text-primary)" }}
      >
        {emphasis ? `🔥 ${value}` : value}
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}
