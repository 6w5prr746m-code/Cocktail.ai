import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CocktailCard } from "../components/CocktailCard";
import { useAllCocktails, useCollections } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { COCKTAIL_CATEGORIES, MAIN_SPIRITS } from "../domain/seed";
import { formatDifficulty } from "../domain/formatting";
import { useTranslation } from "../domain/i18n/useTranslation";
import { getLocalizedCategory, getLocalizedMainSpirit } from "../domain/i18n/localizedCocktail";
import type { TranslationKey } from "../domain/i18n/useTranslation";

const DIFFICULTIES: (1 | 2 | 3)[] = [1, 2, 3];
const DIFFICULTY_LABEL_KEYS: TranslationKey[] = ["recipeForm.difficultyEasy", "recipeForm.difficultyMedium", "recipeForm.difficultyHard"];

export default function LibraryPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const cocktails = useAllCocktails();
  const collections = useCollections();

  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [spirits, setSpirits] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<number>>(new Set());
  const [occasions, setOccasions] = useState<Set<string>>(new Set());

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const results = useMemo(() => {
    const q = query.trim();
    return cocktails.filter((c) => {
      if (spirits.size > 0 && !spirits.has(c.mainSpirit)) return false;
      if (difficulties.size > 0 && !difficulties.has(c.difficulty)) return false;
      if (occasions.size > 0 && !occasions.has(c.category)) return false;
      if (!q) return true;
      if (fuzzyIncludes(q, c.name)) return true;
      return c.ingredients.some((link) => fuzzyIncludes(q, link.ingredientId.replace(/_/g, " ")));
    });
  }, [cocktails, query, spirits, difficulties, occasions]);

  const activeFilterCount = spirits.size + difficulties.size + occasions.size;

  return (
    <div className="pb-8 max-w-[560px] md:max-w-[720px] lg:max-w-[1100px] xl:max-w-[1300px] mx-auto">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          {t("library.title")}
        </h1>
        <button
          type="button"
          onClick={() => navigate("/recipe/new")}
          className="rounded-full flex items-center justify-center font-semibold"
          style={{ width: 36, height: 36, background: "var(--color-accent-gold)", color: "#0b0b0f" }}
          aria-label={t("library.createRecipeAria")}
        >
          +
        </button>
      </div>

      <div className="px-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("library.searchPlaceholder")}
          aria-label={t("library.searchAria")}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-xl px-3 text-sm font-medium relative"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
        >
          {t("library.filtersButton")}
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 rounded-full text-[10px] flex items-center justify-center"
              style={{ width: 16, height: 16, background: "var(--color-accent-gold)", color: "#0b0b0f" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mx-4 mt-3 p-3 rounded-2xl glass-card flex flex-col gap-3">
          <FilterGroup
            title={t("library.mainSpiritFilter")}
            options={MAIN_SPIRITS}
            renderLabel={(v) => getLocalizedMainSpirit(v, locale)}
            selected={spirits}
            onToggle={(v) => toggle(spirits, v, setSpirits)}
          />
          <FilterGroup
            title={t("library.difficultyFilter")}
            options={DIFFICULTIES.map(String)}
            renderLabel={(v) => DIFFICULTY_LABEL_KEYS[Number(v) - 1] ? t(DIFFICULTY_LABEL_KEYS[Number(v) - 1]) : formatDifficulty(Number(v) as 1 | 2 | 3)}
            selected={new Set([...difficulties].map(String))}
            onToggle={(v) => toggle(difficulties, Number(v), setDifficulties)}
          />
          <FilterGroup
            title={t("library.occasionFilter")}
            options={COCKTAIL_CATEGORIES}
            renderLabel={(v) => getLocalizedCategory(v, locale)}
            selected={occasions}
            onToggle={(v) => toggle(occasions, v, setOccasions)}
          />
        </div>
      )}

      {collections.length > 0 && !query && activeFilterCount === 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold px-4 mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("library.collectionsTitle")}
          </h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1">
            {collections.map((col) => (
              <Link
                key={col.id}
                to={`/library/collection/${col.id}`}
                className="flex-shrink-0 rounded-2xl px-4 py-5 flex flex-col gap-2"
                style={{ width: 150, background: "var(--color-surface)" }}
              >
                <span className="text-2xl">✨</span>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {col.name}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t("library.collectionCount", { count: col.cocktailIds.length })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold px-4 mb-3" style={{ color: "var(--color-text-primary)" }}>
          {t("library.allCocktailsTitle", { count: results.length })}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4">
          {results.map((c) => (
            <CocktailCard key={c.id} cocktail={c} />
          ))}
        </div>
        {results.length === 0 && (
          <p className="px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("library.noResults")}
          </p>
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  renderLabel,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  renderLabel?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
        {title.toUpperCase()}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="text-xs rounded-full px-3 py-1.5 font-medium"
            style={{
              background: selected.has(opt) ? "var(--color-accent-gold)" : "var(--color-bg)",
              color: selected.has(opt) ? "#0b0b0f" : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {renderLabel ? renderLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}
