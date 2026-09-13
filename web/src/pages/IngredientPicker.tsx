import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { IngredientChip } from "../components/IngredientChip";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { computeMatches } from "../domain/matchingEngine";
import { useMyBarStore } from "../state/myBar";
import { gradientClassFor } from "../domain/gradient";

export default function IngredientPickerPage() {
  const ingredients = useAllIngredients();
  const cocktails = useAllCocktails();
  const myBarEntries = useMyBarStore((s) => s.entries);
  const myBarIds = useMemo(() => Object.keys(myBarEntries), [myBarEntries]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [ingredients, query]);

  const results = useMemo(() => {
    if (selected.size < 3) return [];
    return computeMatches(selected, cocktails);
  }, [selected, cocktails]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="Recherche magique"
        action={
          myBarIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelected(new Set(myBarIds))}
              className="text-xs font-semibold px-2 py-1.5 rounded-full"
              style={{ background: "var(--color-surface)", color: "var(--color-accent-gold)" }}
            >
              Mon Bar
            </button>
          ) : null
        }
      />

      <div className="px-4 pt-2 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un ingrédient…"
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
          {selected.size} ingrédient{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 px-4 pt-2 pb-8">
        {selected.size < 3 ? (
          <p className="text-sm text-center mt-10" style={{ color: "var(--color-text-secondary)" }}>
            Sélectionne au moins 3 ingrédients pour voir apparaître des cocktails.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-center mt-10" style={{ color: "var(--color-text-secondary)" }}>
            Aucun cocktail ne correspond encore à cette sélection.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.cocktail.id}>
                <Link
                  to={`/cocktail/${r.cocktail.id}`}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className={`rounded-xl flex-shrink-0 ${gradientClassFor(r.cocktail.category)}`} style={{ width: 48, height: 48 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {r.cocktail.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {r.isFullyAvailable
                        ? "Tout est disponible"
                        : `Manque : ${r.missingIngredients.map((i) => i.name).join(", ")}`}
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
