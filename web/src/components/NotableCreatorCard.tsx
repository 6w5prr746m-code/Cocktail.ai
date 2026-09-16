import type { NotableCreator } from "../domain/notableCreators";
import { useTranslation } from "../domain/i18n/useTranslation";

interface NotableCreatorCardProps {
  notable: NotableCreator;
}

// Fiche créateur mise en avant sur la page cocktail — distincte de la
// section "Histoire" (l'anecdote propre au cocktail) qui reste juste en
// dessous : ici, c'est la personne (qui, où, quand, et sa bio) plutôt que
// la recette elle-même.
export function NotableCreatorCard({ notable }: NotableCreatorCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl p-4 glass-card flex gap-3">
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-full text-xl"
        style={{ width: 44, height: 44, background: "var(--color-accent-gold)" }}
        aria-hidden
      >
        🏆
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-accent-gold-text)" }}>
          {t("notableCreator.eyebrow")}
        </p>
        <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {notable.creator}
        </p>
        <p className="text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
          {notable.place} · {notable.year}
        </p>
        {notable.bio && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {notable.bio}
          </p>
        )}
      </div>
    </div>
  );
}
