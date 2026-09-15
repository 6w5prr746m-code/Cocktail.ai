import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllIngredients, useCocktail } from "../domain/catalog";
import { slugify } from "../domain/slug";
import { COCKTAIL_CATEGORIES } from "../domain/seed";
import { useCustomIngredientsStore } from "../state/customIngredients";
import { useUserRecipesStore } from "../state/userRecipes";
import type { Cocktail, CocktailIngredientLink, IngredientRole, RecipeStep } from "../domain/types";
import { useTranslation } from "../domain/i18n/useTranslation";

const ROLES: IngredientRole[] = ["primarySpirit", "secondarySpirit", "modifier", "mixer", "garnish"];

interface IngredientDraft {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  isOptional: boolean;
  role: IngredientRole;
}

interface StepDraft {
  key: string;
  instruction: string;
  durationSeconds: string;
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const existing = useCocktail(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const upsert = useUserRecipesStore((s) => s.upsert);
  const findOrCreateIngredient = useCustomIngredientsStore().findOrCreate;
  const existingRecipes = useUserRecipesStore((s) => s.recipes);
  const allIngredients = useAllIngredients();

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? COCKTAIL_CATEGORIES[0] ?? "Classique");
  const [mainSpirit, setMainSpirit] = useState(existing?.mainSpirit ?? "");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(existing?.difficulty ?? 1);
  const [prepTime, setPrepTime] = useState(String(existing?.preparationTimeMinutes ?? 3));
  const [glassware, setGlassware] = useState(existing?.glassware ?? "");
  const [iceType, setIceType] = useState(existing?.iceType ?? "");
  const [garnish, setGarnish] = useState(existing?.garnish ?? "");
  const [tips, setTips] = useState(existing?.tips ?? "");
  const [history, setHistory] = useState(existing?.history ?? "");
  const [origin, setOrigin] = useState(existing?.origin ?? "");
  const [error, setError] = useState<string | null>(null);

  const [ingredientRows, setIngredientRows] = useState<IngredientDraft[]>(
    existing
      ? existing.ingredients.map((link) => ({
          key: newKey(),
          name: allIngredients.find((i) => i.id === link.ingredientId)?.name ?? link.ingredientId,
          quantity: String(link.quantity),
          unit: link.unit,
          isOptional: link.isOptional,
          role: link.role,
        }))
      : [{ key: newKey(), name: "", quantity: "", unit: "cl", isOptional: false, role: "modifier" }],
  );

  const [stepRows, setStepRows] = useState<StepDraft[]>(
    existing
      ? existing.steps.map((s) => ({ key: newKey(), instruction: s.instruction, durationSeconds: s.durationSeconds ? String(s.durationSeconds) : "" }))
      : [{ key: newKey(), instruction: "", durationSeconds: "" }],
  );

  function updateIngredient(key: string, patch: Partial<IngredientDraft>) {
    setIngredientRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function updateStep(key: string, patch: Partial<StepDraft>) {
    setStepRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function uniqueSlug(base: string): string {
    let candidate = slugify(base) || "cocktail";
    if (isEditing && existing) return existing.id;
    const taken = new Set(existingRecipes.map((r) => r.id));
    let suffix = 1;
    let result = candidate;
    while (taken.has(result)) {
      suffix += 1;
      result = `${candidate}_${suffix}`;
    }
    return result;
  }

  function handleSave() {
    const trimmedName = name.trim();
    const validIngredientRows = ingredientRows.filter((r) => r.name.trim().length > 0);
    const validStepRows = stepRows.filter((r) => r.instruction.trim().length > 0);

    if (!trimmedName) return setError(t("recipeForm.errorNameRequired"));
    if (validIngredientRows.length === 0) return setError(t("recipeForm.errorIngredientRequired"));
    if (validStepRows.length === 0) return setError(t("recipeForm.errorStepRequired"));

    const ingredients: CocktailIngredientLink[] = validIngredientRows.map((row) => {
      const ingredient = findOrCreateIngredient(row.name.trim());
      return {
        ingredientId: ingredient.id,
        quantity: Number(row.quantity) || 0,
        unit: row.unit.trim() || "cl",
        isOptional: row.isOptional,
        role: row.role,
      };
    });

    const steps: RecipeStep[] = validStepRows.map((row, index) => ({
      order: index + 1,
      instruction: row.instruction.trim(),
      durationSeconds: row.durationSeconds.trim() ? Number(row.durationSeconds) : null,
    }));

    const cocktail: Cocktail = {
      id: uniqueSlug(trimmedName),
      name: trimmedName,
      category,
      origin: origin.trim() || "Ta création",
      history: history.trim() || null,
      difficulty,
      mainSpirit: mainSpirit.trim() || "Aucun",
      preparationTimeMinutes: Number(prepTime) || 1,
      glassware: glassware.trim() || "Verre au choix",
      iceType: iceType.trim() || "Selon préférence",
      garnish: garnish.trim() || "Libre",
      tips: tips.trim() || null,
      imageURL: "",
      ingredients,
      steps,
      variantIds: [],
      isUserCreated: true,
    };

    upsert(cocktail);
    navigate(`/cocktail/${cocktail.id}`);
  }

  return (
    <div className="pb-10 max-w-[640px] mx-auto">
      <ScreenHeader title={isEditing ? t("recipeForm.titleEdit") : t("recipeForm.titleNew")} />

      <div className="px-4 pt-3 flex flex-col gap-4">
        {error && (
          <p className="text-sm rounded-xl p-3" style={{ background: "var(--color-danger)", color: "white" }}>
            {error}
          </p>
        )}

        <Field label={t("recipeForm.nameLabel")}>
          <TextInput value={name} onChange={setName} placeholder={t("recipeForm.namePlaceholder")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("recipeForm.categoryLabel")}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label={t("recipeForm.categoryLabel")}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
            >
              {COCKTAIL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("recipeForm.difficultyLabel")}>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
              aria-label={t("recipeForm.difficultyLabel")}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
            >
              <option value={1}>{t("recipeForm.difficultyEasy")}</option>
              <option value={2}>{t("recipeForm.difficultyMedium")}</option>
              <option value={3}>{t("recipeForm.difficultyHard")}</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("recipeForm.mainSpiritLabel")}>
            <TextInput value={mainSpirit} onChange={setMainSpirit} placeholder={t("recipeForm.mainSpiritPlaceholder")} />
          </Field>
          <Field label={t("recipeForm.prepTimeLabel")}>
            <TextInput value={prepTime} onChange={setPrepTime} type="number" placeholder={t("recipeForm.prepTimePlaceholder")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("recipeForm.glasswareLabel")}>
            <TextInput value={glassware} onChange={setGlassware} placeholder={t("recipeForm.glasswarePlaceholder")} />
          </Field>
          <Field label={t("recipeForm.iceTypeLabel")}>
            <TextInput value={iceType} onChange={setIceType} placeholder={t("recipeForm.iceTypePlaceholder")} />
          </Field>
        </div>

        <Field label={t("recipeForm.garnishLabel")}>
          <TextInput value={garnish} onChange={setGarnish} placeholder={t("recipeForm.garnishPlaceholder")} />
        </Field>

        <Field label={t("recipeForm.ingredientsLabel")}>
          <div className="flex flex-col gap-2">
            {ingredientRows.map((row, idx) => (
              <div key={row.key} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--color-surface)" }}>
                <TextInput value={row.name} onChange={(v) => updateIngredient(row.key, { name: v })} placeholder={t("recipeForm.ingredientNamePlaceholder")} />
                <div className="flex gap-2">
                  <TextInput value={row.quantity} onChange={(v) => updateIngredient(row.key, { quantity: v })} type="number" placeholder={t("recipeForm.quantityPlaceholder")} />
                  <TextInput value={row.unit} onChange={(v) => updateIngredient(row.key, { unit: v })} placeholder={t("recipeForm.unitPlaceholder")} />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <select
                    value={row.role}
                    onChange={(e) => updateIngredient(row.key, { role: e.target.value as IngredientRole })}
                    aria-label={t("recipeForm.roleAria", { name: row.name || String(idx + 1) })}
                    className="text-xs rounded-lg px-2 py-1.5"
                    style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`ingredientRole.${r}`)}
                      </option>
                    ))}
                  </select>
                  <label className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={row.isOptional}
                      onChange={(e) => updateIngredient(row.key, { isOptional: e.target.checked })}
                    />
                    {t("recipeForm.optionalLabel")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIngredientRows((rows) => rows.filter((r) => r.key !== row.key))}
                    className="text-xs"
                    style={{ color: "var(--color-danger-text)" }}
                  >
                    {t("recipeForm.deleteButton")}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setIngredientRows((rows) => [...rows, { key: newKey(), name: "", quantity: "", unit: "cl", isOptional: false, role: "modifier" }])
              }
              className="text-sm rounded-xl py-2.5 font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-accent-gold-text)" }}
            >
              {t("recipeForm.addIngredientButton")}
            </button>
          </div>
        </Field>

        <Field label={t("recipeForm.stepsLabel")}>
          <div className="flex flex-col gap-2">
            {stepRows.map((row, idx) => (
              <div key={row.key} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--color-surface)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("recipeForm.stepNumber", { number: idx + 1 })}
                </p>
                <TextInput value={row.instruction} onChange={(v) => updateStep(row.key, { instruction: v })} placeholder={t("recipeForm.instructionPlaceholder")} />
                <div className="flex items-center gap-2">
                  <TextInput
                    value={row.durationSeconds}
                    onChange={(v) => updateStep(row.key, { durationSeconds: v })}
                    type="number"
                    placeholder={t("recipeForm.durationPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setStepRows((rows) => rows.filter((r) => r.key !== row.key))}
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--color-danger-text)" }}
                  >
                    {t("recipeForm.deleteButton")}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setStepRows((rows) => [...rows, { key: newKey(), instruction: "", durationSeconds: "" }])}
              className="text-sm rounded-xl py-2.5 font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-accent-gold-text)" }}
            >
              {t("recipeForm.addStepButton")}
            </button>
          </div>
        </Field>

        <Field label={t("recipeForm.historyLabel")}>
          <TextInput value={history} onChange={setHistory} placeholder={t("recipeForm.historyPlaceholder")} />
        </Field>
        <Field label={t("recipeForm.originLabel")}>
          <TextInput value={origin} onChange={setOrigin} placeholder={t("recipeForm.originPlaceholder")} />
        </Field>
        <Field label={t("recipeForm.tipsLabel")}>
          <TextInput value={tips} onChange={setTips} placeholder={t("recipeForm.tipsPlaceholder")} />
        </Field>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl py-4 font-semibold text-base mt-2"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {isEditing ? t("recipeForm.saveButtonEdit") : t("recipeForm.saveButtonNew")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
      style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
    />
  );
}
