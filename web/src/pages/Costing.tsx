import { useMemo, useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { computeCocktailCost, isVolumetricUnit, suggestedSellPrice, toClEquivalent } from "../domain/costing";
import { formatCurrency, formatQuantity } from "../domain/formatting";
import { useIngredientCostsStore } from "../state/ingredientCosts";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedUnit } from "../domain/i18n/localizedCocktail";

const TARGET_RATIOS = [0.2, 0.25, 0.3];

export default function CostingPage() {
  const { t, locale } = useTranslation();
  const cocktails = useAllCocktails();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const prices = useIngredientCostsStore((s) => s.prices);
  const setPrice = useIngredientCostsStore((s) => s.setPrice);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    return cocktails.filter((c) => !q || fuzzyIncludes(q, c.name)).slice(0, 40);
  }, [cocktails, query]);

  const selected = useMemo(() => cocktails.find((c) => c.id === selectedId) ?? null, [cocktails, selectedId]);
  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  const clLines = useMemo(
    () => (selected ? selected.ingredients.filter((link) => isVolumetricUnit(link.unit)) : []),
    [selected],
  );
  const otherLines = useMemo(
    () => (selected ? selected.ingredients.filter((link) => !isVolumetricUnit(link.unit)) : []),
    [selected],
  );

  const breakdown = useMemo(() => (selected ? computeCocktailCost(selected, prices) : null), [selected, prices]);

  function updatePrice(ingredientId: string, field: "bottlePrice" | "bottleSizeCl", value: string) {
    const num = Number(value.replace(",", "."));
    if (Number.isNaN(num) || num < 0) return;
    const current = prices[ingredientId] ?? { bottlePrice: 0, bottleSizeCl: 70 };
    setPrice(ingredientId, { ...current, [field]: num });
  }

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      <ScreenHeader title={t("costing.title")} />
      <div className="px-4 pt-3 flex flex-col gap-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("costing.intro")}
        </p>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("costing.selectCocktailTitle")}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("partyPlanner.searchPlaceholder")}
            aria-label={t("costing.searchAria")}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
          />
          <ul className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {filtered.map((c) => {
              const isSelected = selectedId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    aria-pressed={isSelected}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium"
                    style={{
                      background: isSelected ? "var(--color-accent-gold)" : "var(--color-surface)",
                      color: isSelected ? "#0b0b0f" : "var(--color-text-primary)",
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && breakdown && (
          <>
            <div>
              <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                {t("costing.pricesHeading")}
              </h2>
              <ul className="flex flex-col gap-2">
                {clLines.map((link) => {
                  const price = prices[link.ingredientId];
                  const quantityCl = toClEquivalent(link.quantity, link.unit);
                  const lineCost = price && price.bottleSizeCl > 0 && quantityCl !== null ? (quantityCl / price.bottleSizeCl) * price.bottlePrice : null;
                  return (
                    <li key={link.ingredientId} className="rounded-2xl p-3" style={{ background: "var(--color-surface)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {ingredientNameById.get(link.ingredientId) ?? link.ingredientId}
                          <span className="ml-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            ({formatQuantity(link.quantity)} {getLocalizedUnit(link.unit, locale)})
                          </span>
                        </span>
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--color-accent-gold-text)" }}>
                          {lineCost !== null ? formatCurrency(lineCost) : "—"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          defaultValue={price?.bottlePrice ?? ""}
                          onBlur={(e) => updatePrice(link.ingredientId, "bottlePrice", e.target.value)}
                          placeholder={t("costing.bottlePricePlaceholder")}
                          aria-label={t("costing.bottlePriceAria", { name: ingredientNameById.get(link.ingredientId) ?? link.ingredientId })}
                          className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                        />
                        <input
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={price?.bottleSizeCl ?? 70}
                          onBlur={(e) => updatePrice(link.ingredientId, "bottleSizeCl", e.target.value)}
                          placeholder={t("costing.bottleSizePlaceholder")}
                          aria-label={t("costing.bottleSizeAria", { name: ingredientNameById.get(link.ingredientId) ?? link.ingredientId })}
                          className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {otherLines.length > 0 && (
                <p className="text-xs mt-3" style={{ color: "var(--color-text-secondary)" }}>
                  {t("costing.uncostedNote", {
                    names: otherLines.map((l) => ingredientNameById.get(l.ingredientId) ?? l.ingredientId).join(", "),
                  })}
                </p>
              )}
            </div>

            <div className="rounded-2xl p-4 glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {t("costing.totalCostLabel")}
                </span>
                <span className="text-lg font-bold" style={{ color: "var(--color-accent-gold-text)" }}>
                  {formatCurrency(breakdown.costedTotal)}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
                {t("costing.suggestedPriceHeading")}
              </p>
              <div className="flex flex-col gap-1.5">
                {TARGET_RATIOS.map((ratio) => (
                  <div key={ratio} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {t("costing.targetRatioLabel", { percent: Math.round(ratio * 100) })}
                    </span>
                    <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {formatCurrency(suggestedSellPrice(breakdown.costedTotal, ratio))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
