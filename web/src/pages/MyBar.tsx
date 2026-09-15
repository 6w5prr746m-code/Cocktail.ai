import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { computeAdvancedMatches } from "../domain/matchingEngine";
import { SEED_SUBSTITUTIONS } from "../domain/seed";
import { STARTER_INGREDIENTS } from "../domain/starterIngredients";
import { evaluateBarReadiness, STOCK_STATUS_ORDER } from "../domain/types";
import type { StockStatus } from "../domain/types";
import { useMyBarStore } from "../state/myBar";
import { useShoppingListStore } from "../state/shoppingList";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedIngredientCategory, getLocalizedIngredientName } from "../domain/i18n/localizedCocktail";

const ALMOST_READY_LIMIT = 6;

const STOCK_OPTIONS: StockStatus[] = ["available", "low", "almostEmpty"];

export default function MyBarPage() {
  const { t, locale } = useTranslation();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const cocktails = useAllCocktails();
  const { entries, addIngredient, removeIngredient, setStockStatus, setApproximateQuantity } = useMyBarStore();
  const { items: shoppingItems, addItems, removeItem: removeShoppingItem, toggleChecked, clearChecked } = useShoppingListStore();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [editingQtyFor, setEditingQtyFor] = useState<string | null>(null);

  const inventory = useMemo(() => {
    const map = new Map<string, StockStatus>();
    for (const entry of Object.values(entries)) map.set(entry.ingredientId, entry.stockStatus);
    return map;
  }, [entries]);

  const advancedMatches = useMemo(
    () => computeAdvancedMatches(inventory, cocktails, SEED_SUBSTITUTIONS),
    [inventory, cocktails],
  );
  const unlockedCount = advancedMatches.filter((m) => m.availability === "ready").length;
  const readiness = evaluateBarReadiness(Object.keys(entries).length, unlockedCount);
  const readinessText = { title: t(`barReadiness.${readiness}Title`), subtitle: t(`barReadiness.${readiness}Subtitle`) };

  const almostReady = useMemo(
    () => advancedMatches.filter((m) => m.availability === "missingFew").slice(0, ALMOST_READY_LIMIT),
    [advancedMatches],
  );

  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  const shoppingRows = useMemo(
    () =>
      Object.values(shoppingItems)
        .map((item) => ({ item, ingredient: ingredients.find((i) => i.id === item.ingredientId) }))
        .filter((x) => x.ingredient)
        .sort((a, b) => Number(a.item.checked) - Number(b.item.checked)),
    [shoppingItems, ingredients],
  );
  const hasCheckedItems = shoppingRows.some((r) => r.item.checked);

  const ownedIngredients = useMemo(
    () =>
      Object.values(entries)
        .map((entry) => ({ entry, ingredient: ingredients.find((i) => i.id === entry.ingredientId) }))
        .filter((x) => x.ingredient)
        .sort((a, b) => STOCK_STATUS_ORDER[a.entry.stockStatus] - STOCK_STATUS_ORDER[b.entry.stockStatus]),
    [entries, ingredients],
  );

  const categories = useMemo(() => Array.from(new Set(ingredients.map((i) => i.category))).sort(), [ingredients]);

  const availableToAdd = useMemo(() => {
    const q = query.trim();
    return ingredients.filter((i) => {
      if (entries[i.id]) return false;
      if (category && i.category !== category) return false;
      if (q && !fuzzyIncludes(q, i.name)) return false;
      return true;
    });
  }, [ingredients, entries, query, category]);

  return (
    <div className="pb-8">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          {t("myBar.title")}
        </h1>
        <div
          className="rounded-2xl p-4 flex items-center gap-4 glass-card"
          role="group"
          aria-label={`${readinessText.title}. ${readinessText.subtitle}`}
        >
          <CompatibilityRing
            fraction={Math.min(unlockedCount / 10, 1)}
            visualLabelOverride={String(unlockedCount)}
            size={72}
          />
          <div>
            <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {readinessText.title}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {readinessText.subtitle}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(entries).length === 0 && (
        <section className="px-4 pb-6">
          <div className="rounded-2xl p-4 glass-card">
            <p className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {t("myBar.emptyTitle")}
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
              {t("myBar.emptyBody")}
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_INGREDIENTS.map((ingredient) => (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => addIngredient(ingredient.id)}
                  className="text-sm rounded-full px-3.5 py-2 font-medium"
                  style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                >
                  ✨ {getLocalizedIngredientName(ingredient.id, ingredient.name, locale)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {almostReady.length > 0 && (
        <section className="px-4 pb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("myBar.almostReadyTitle")}
          </h2>
          <ul className="flex flex-col gap-2">
            {almostReady.map((match) => (
              <li key={match.cocktail.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
                <Link to={`/cocktail/${match.cocktail.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <MiniGlassBadge cocktail={match.cocktail} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {match.cocktail.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {t("myBar.missingPrefix", { items: match.missingIngredients.map((i) => ingredientNameById.get(i.id) ?? i.name).join(", ") })}
                    </p>
                  </div>
                </Link>
                <CompatibilityRing fraction={match.compatibilityScore} size={34} strokeWidth={4} />
                <button
                  type="button"
                  onClick={() => addItems(match.missingIngredients.map((i) => i.id))}
                  aria-label={t("myBar.addMissingAria", { name: match.cocktail.name })}
                  title={t("myBar.addToShoppingTitle")}
                  className="flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 30, height: 30, background: "var(--color-bg)" }}
                >
                  🛒
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shoppingRows.length > 0 && (
        <section className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {t("myBar.shoppingListTitle")}
            </h2>
            {hasCheckedItems && (
              <button type="button" onClick={clearChecked} className="text-xs font-medium underline" style={{ color: "var(--color-text-secondary)" }}>
                {t("myBar.clearChecked")}
              </button>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {shoppingRows.map(({ item, ingredient }) => (
              <li
                key={item.ingredientId}
                className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
                style={{ background: "var(--color-surface)", opacity: item.checked ? 0.55 : 1 }}
              >
                <button
                  type="button"
                  onClick={() => toggleChecked(item.ingredientId)}
                  aria-label={item.checked ? t("myBar.uncheckAria", { name: ingredient!.name }) : t("myBar.checkAria", { name: ingredient!.name })}
                  className="flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    border: `2px solid ${item.checked ? "var(--color-success)" : "var(--color-border)"}`,
                    background: item.checked ? "var(--color-success)" : "transparent",
                    color: "#0b0b0f",
                    fontSize: 12,
                  }}
                >
                  {item.checked ? "✓" : ""}
                </button>
                <span
                  className="flex-1 text-sm"
                  style={{ color: "var(--color-text-primary)", textDecoration: item.checked ? "line-through" : "none" }}
                >
                  {ingredient!.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeShoppingItem(item.ingredientId)}
                  aria-label={t("myBar.removeFromListAria", { name: ingredient!.name })}
                  className="flex-shrink-0 text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ownedIngredients.length > 0 && (
        <section className="px-4 pb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("myBar.ownedTitle", { count: ownedIngredients.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {ownedIngredients.map(({ entry, ingredient }) => (
              <li
                key={entry.ingredientId}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: "var(--color-surface)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {ingredient!.name}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {STOCK_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStockStatus(entry.ingredientId, status)}
                        className="text-[11px] rounded-full px-2.5 py-1 font-medium"
                        style={{
                          background: entry.stockStatus === status ? "var(--color-accent-gold)" : "var(--color-bg)",
                          color: entry.stockStatus === status ? "#0b0b0f" : "var(--color-text-secondary)",
                        }}
                      >
                        {t(`stockStatus.${status}`)}
                      </button>
                    ))}
                  </div>
                  {editingQtyFor === entry.ingredientId ? (
                    <input
                      autoFocus
                      defaultValue={entry.approximateQuantity ?? ""}
                      onBlur={(e) => {
                        setApproximateQuantity(entry.ingredientId, e.target.value);
                        setEditingQtyFor(null);
                      }}
                      placeholder={t("myBar.approximateQtyPlaceholder")}
                      aria-label={t("myBar.approximateQtyAria", { name: ingredient!.name })}
                      className="mt-2 w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingQtyFor(entry.ingredientId)}
                      className="text-[11px] mt-1.5 underline"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {entry.approximateQuantity ?? t("myBar.addApproximateQty")}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(entry.ingredientId)}
                  aria-label={t("myBar.removeIngredientAria", { name: ingredient!.name })}
                  className="flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 30, height: 30, background: "var(--color-bg)", color: "var(--color-danger-text)" }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="px-4">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("myBar.addIngredientTitle")}
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("myBar.searchIngredientPlaceholder")}
          aria-label={t("myBar.searchIngredientAria")}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
        />
        <div className="flex gap-2 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="flex-shrink-0 text-xs rounded-full px-3 py-1.5 font-medium"
            style={{
              background: category === null ? "var(--color-accent-gold)" : "var(--color-surface)",
              color: category === null ? "#0b0b0f" : "var(--color-text-primary)",
            }}
          >
            {t("myBar.allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="flex-shrink-0 text-xs rounded-full px-3 py-1.5 font-medium"
              style={{
                background: category === cat ? "var(--color-accent-gold)" : "var(--color-surface)",
                color: category === cat ? "#0b0b0f" : "var(--color-text-primary)",
              }}
            >
              {getLocalizedIngredientCategory(cat, locale)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableToAdd.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => addIngredient(ingredient.id)}
              className="text-sm rounded-full px-3.5 py-2 font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
            >
              + {ingredient.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
