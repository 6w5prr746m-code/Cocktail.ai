import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { IngredientChip } from "../components/IngredientChip";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { GlassArt } from "../components/GlassArt";
import type { CocktailArt } from "../domain/glassArt";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { computeMatches } from "../domain/matchingEngine";
import { useMyBarStore } from "../state/myBar";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";

const EMPTY_STATE_ART: CocktailArt = { shape: "coupe", liquidColor: "#e8d9a8", garnish: "none", ice: "none" };

export default function IngredientPickerPage() {
  const { t } = useTranslation();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const cocktails = useAllCocktails();
  const myBarEntries = useMyBarStore((s) => s.entries);
  const myBarIds = useMemo(() => Object.keys(myBarEntries), [myBarEntries]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return ingredients;
    return ingredients.filter((i) => fuzzyIncludes(q, i.name) || fuzzyIncludes(q, i.category));
  }, [ingredients, query]);

  const results = useMemo(() => {
    if (selected.size < 3) return [];
    return computeMatches(selected, cocktails);
  }, [selected, cocktails]);

  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col min-h-full max-w-[640px] mx-auto w-full">
      <ScreenHeader
        title={t("ingredientPicker.title")}
        action={
          myBarIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelected(new Set(myBarIds))}
              className="text-xs font-semibold px-2 py-1.5 rounded-full"
              style={{ background: "var(--color-surface)", color: "var(--color-accent-gold-text)" }}
            >
              {t("ingredientPicker.myBarButton")}
            </button>
          ) : null
        }
      />

      <div className="px-4 pt-2 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ingredientPicker.searchPlaceholder")}
          aria-label={t("ingredientPicker.searchAria")}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
        />
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {filtered.map((ingredient) => (
          <IngredientChip
            key={ingredient.id}
            label={ingredient.name}
            colorHex={ingredient.colorHex}
            selected={selected.has(ingredient.id)}
            onClick={() => toggle(ingredient.id)}
          />
        ))}
      </div>

      <div className="px-4 pb-2 flex items-center gap-3">
        <CompatibilityRing fraction={Math.min(selected.size / 6, 1)} size={56} strokeWidth={6} visualLabelOverride={String(selected.size)} />
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("ingredientPicker.selectedCount", { count: selected.size })}
        </p>
      </div>

      <div className="flex-1 px-4 pt-2 pb-8">
        {selected.size < 3 ? (
          <div className="flex flex-col items-center mt-8 gap-3 text-center">
            <div className="opacity-80">
              <GlassArt art={EMPTY_STATE_ART} size={72} fillFraction={0.18} />
            </div>
            <p className="text-sm max-w-[220px]" style={{ color: "var(--color-text-secondary)" }}>
              {t("ingredientPicker.emptyMin3")}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center mt-8 gap-3 text-center">
            <div className="opacity-80">
              <GlassArt art={EMPTY_STATE_ART} size={72} fillFraction={0} />
            </div>
            <p className="text-sm max-w-[220px]" style={{ color: "var(--color-text-secondary)" }}>
              {t("ingredientPicker.emptyNoResults")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.cocktail.id}>
                <Link
                  to={`/cocktail/${r.cocktail.id}`}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "var(--color-surface)" }}
                >
                  <MiniGlassBadge cocktail={r.cocktail} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {r.cocktail.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {r.isFullyAvailable
                        ? t("ingredientPicker.fullyAvailable")
                        : t("myBar.missingPrefix", { items: r.missingIngredients.map((i) => ingredientNameById.get(i.id) ?? i.name).join(", ") })}
                    </p>
                  </div>
                  <CompatibilityRing fraction={r.compatibilityScore} size={40} strokeWidth={4} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
