import { useMemo } from "react";
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
    <div className="pb-8">
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
