import { useMemo, useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { formatQuantity } from "../domain/formatting";
import { computePartyIngredients } from "../domain/partyPlanner";
import { useShoppingListStore } from "../state/shoppingList";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedUnit } from "../domain/i18n/localizedCocktail";

const GUEST_MIN = 1;
const GUEST_MAX = 30;

export default function PartyPlannerPage() {
  const { t, locale } = useTranslation();
  const cocktails = useAllCocktails();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const addItems = useShoppingListStore((s) => s.addItems);

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(4);
  const [added, setAdded] = useState(false);

  // Les cocktails déjà sélectionnés restent affichés (et en tête de liste)
  // même quand la recherche filtre sur autre chose — sinon changer de
  // recherche les fait disparaître de la liste, donnant l'impression
  // trompeuse qu'ils ont été désélectionnés.
  const filtered = useMemo(() => {
    const q = query.trim();
    const selectedSet = new Set(selectedIds);
    return cocktails
      .filter((c) => selectedSet.has(c.id) || !q || fuzzyIncludes(q, c.name))
      .sort((a, b) => Number(selectedSet.has(b.id)) - Number(selectedSet.has(a.id)))
      .slice(0, 40);
  }, [cocktails, query, selectedIds]);

  const selectedCocktails = useMemo(
    () => selectedIds.map((id) => cocktails.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [selectedIds, cocktails],
  );

  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  const lines = useMemo(() => computePartyIngredients(selectedCocktails, guestCount), [selectedCocktails, guestCount]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addAllToShoppingList() {
    addItems(lines.map((l) => l.ingredientId));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      <ScreenHeader title={t("partyPlanner.title")} />
      <div className="px-4 pt-3 flex flex-col gap-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("partyPlanner.intro")}
        </p>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("partyPlanner.guestCountLabel")}
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuestCount((g) => Math.max(GUEST_MIN, g - 1))}
              aria-label={t("partyPlanner.decreaseGuestsAria")}
              className="rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ width: 40, height: 40, background: "var(--color-surface)", color: "var(--color-text-primary)" }}
            >
              −
            </button>
            <span className="text-xl font-bold w-10 text-center" style={{ color: "var(--color-text-primary)" }}>
              {guestCount}
            </span>
            <button
              type="button"
              onClick={() => setGuestCount((g) => Math.min(GUEST_MAX, g + 1))}
              aria-label={t("partyPlanner.increaseGuestsAria")}
              className="rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ width: 40, height: 40, background: "var(--color-surface)", color: "var(--color-text-primary)" }}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("partyPlanner.selectCocktailsTitle", { count: selectedIds.length })}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("partyPlanner.searchPlaceholder")}
            aria-label={t("partyPlanner.searchAria")}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
          />
          <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {filtered.map((c) => {
              const selected = selectedIds.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={selected}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium flex items-center gap-2"
                    style={{
                      background: selected ? "var(--color-accent-gold)" : "var(--color-surface)",
                      color: selected ? "#0b0b0f" : "var(--color-text-primary)",
                    }}
                  >
                    <span aria-hidden>{selected ? "✓" : ""}</span>
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {lines.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {t("partyPlanner.shoppingListTitle")}
            </h2>
            <ul className="flex flex-col gap-2 mb-3">
              {lines.map((line) => (
                <li
                  key={`${line.ingredientId}-${line.unit}`}
                  className="rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3"
                  style={{ background: "var(--color-surface)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {ingredientNameById.get(line.ingredientId) ?? line.ingredientId}
                  </span>
                  <span className="text-sm font-medium flex-shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                    {formatQuantity(line.totalQuantity)} {getLocalizedUnit(line.unit, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addAllToShoppingList}
              className="w-full rounded-2xl py-4 font-semibold text-base"
              style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
            >
              {added ? t("partyPlanner.added") : t("partyPlanner.addAllButton")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
