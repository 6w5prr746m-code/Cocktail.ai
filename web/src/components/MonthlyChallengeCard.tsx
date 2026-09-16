import { useState } from "react";
import { Link } from "react-router-dom";
import type { Cocktail } from "../domain/types";
import type { MonthlyTheme } from "../domain/monthlyChallenge";
import { useTranslation } from "../domain/i18n/useTranslation";
import { CocktailVisual } from "./CocktailVisual";
import { ShareCardModal } from "./ShareCardModal";

interface MonthlyChallengeCardProps {
  theme: MonthlyTheme;
  cocktail: Cocktail;
  completed: boolean;
}

// Même invariant que WeeklyChallengeCard : CocktailVisual reçoit toujours le
// cocktail canonique (jamais localisé), voir le commentaire de CocktailCard.
export function MonthlyChallengeCard({ theme, cocktail, completed }: MonthlyChallengeCardProps) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);

  return (
    <>
      <Link
        to={`/cocktail/${cocktail.id}`}
        className="flex items-center gap-3 rounded-2xl p-3 glass-card animate-fade-in transition-transform active:scale-[0.98]"
      >
        <div className="flex-shrink-0 relative flex items-center justify-center rounded-xl overflow-hidden" style={{ width: 56, height: 56 }}>
          <CocktailVisual cocktail={cocktail} glassSize={40} variant="thumb" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-accent-gold-text)" }}>
            {theme.icon} {t("monthlyChallenge.label")} · {t(theme.titleKey)}
          </p>
          <p className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
            {cocktail.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
            {t(theme.descKey)}
          </p>
        </div>
        {completed ? (
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSharing(true);
              }}
              aria-label={t("shareCard.shareAria")}
              className="rounded-full flex items-center justify-center"
              style={{ width: 28, height: 28, background: "var(--color-surface)" }}
            >
              📤
            </button>
            <span
              className="rounded-full text-xs font-semibold px-2.5 py-1"
              style={{ background: "var(--color-success)", color: "#0b0b0f" }}
            >
              {t("monthlyChallenge.done")}
            </span>
          </div>
        ) : (
          <span className="flex-shrink-0 text-xl" aria-hidden>
            →
          </span>
        )}
      </Link>
      {sharing && (
        <ShareCardModal
          emoji={theme.icon}
          title={t("shareCard.monthlyTitle")}
          subtitle={`${t(theme.titleKey)} · ${cocktail.name}`}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
