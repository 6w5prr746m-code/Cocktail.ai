import { Link } from "react-router-dom";
import type { Cocktail } from "../domain/types";
import { useTranslation } from "../domain/i18n/useTranslation";
import { CocktailVisual } from "./CocktailVisual";

interface WeeklyChallengeCardProps {
  cocktail: Cocktail;
  completed: boolean;
}

// Pas de raw/localized à gérer ici : CocktailVisual reçoit toujours le
// cocktail canonique (même invariant que CocktailCard, voir son commentaire).
export function WeeklyChallengeCard({ cocktail, completed }: WeeklyChallengeCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className="flex items-center gap-3 rounded-2xl p-3 glass-card animate-fade-in transition-transform active:scale-[0.98]"
    >
      <div className="flex-shrink-0 relative flex items-center justify-center rounded-xl overflow-hidden" style={{ width: 56, height: 56 }}>
        <CocktailVisual cocktail={cocktail} glassSize={40} variant="thumb" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-accent-gold-text)" }}>
          {t("home.weeklyChallengeLabel")}
        </p>
        <p className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
          {cocktail.name}
        </p>
      </div>
      {completed ? (
        <span
          className="flex-shrink-0 rounded-full text-xs font-semibold px-2.5 py-1"
          style={{ background: "var(--color-success)", color: "#0b0b0f" }}
        >
          {t("home.weeklyChallengeDone")}
        </span>
      ) : (
        <span className="flex-shrink-0 text-xl" aria-hidden>
          →
        </span>
      )}
    </Link>
  );
}
