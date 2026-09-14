import { useState } from "react";
import { GlassArt } from "./GlassArt";
import type { CocktailArt } from "../domain/glassArt";
import { STARTER_INGREDIENTS } from "../domain/starterIngredients";
import { useMyBarStore } from "../state/myBar";
import { useOnboardingStore } from "../state/onboarding";

interface Step {
  art: CocktailArt;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    art: { shape: "coupe", liquidColor: "#c9a227", garnish: "citrusTwist", garnishColor: "#e8d9a8", ice: "none" },
    title: "Bienvenue sur Cocktail.ai",
    body: "Trouve le cocktail parfait selon ce que tu as sous la main, prépare-le pas à pas, et découvre de nouvelles recettes en chemin.",
  },
  {
    art: { shape: "highball", liquidColor: "#2dd4bf", garnish: "mint", ice: "crushed" },
    title: "Dis-nous ce que tu as",
    body: "Dans la recherche magique, sélectionne tes ingrédients : les cocktails réalisables apparaissent en temps réel, triés par compatibilité.",
  },
  {
    art: { shape: "rocks", liquidColor: "#d9a441", garnish: "cherry", ice: "cubes" },
    title: "Garde Mon Bar à jour",
    body: "Mon Bar retient ce que tu as chez toi et débloque automatiquement de nouveaux cocktails. Quelques ingrédients courants pour commencer :",
  },
];

export function OnboardingFlow() {
  const completed = useOnboardingStore((s) => s.completed);
  const complete = useOnboardingStore((s) => s.complete);
  const myBarEntries = useMyBarStore((s) => s.entries);
  const addIngredient = useMyBarStore((s) => s.addIngredient);
  const [step, setStep] = useState(0);

  if (completed) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "var(--color-bg)", maxWidth: 560, margin: "0 auto" }}
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={complete}
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Passer
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div style={{ color: "var(--color-accent-gold)" }}>
          <GlassArt art={current.art} size={110} fillFraction={0.62} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          {current.title}
        </h1>
        <p className="text-sm leading-relaxed max-w-[320px]" style={{ color: "var(--color-text-secondary)" }}>
          {current.body}
        </p>

        {isLast && (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {STARTER_INGREDIENTS.map((ingredient) => {
              const owned = Boolean(myBarEntries[ingredient.id]);
              return (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => !owned && addIngredient(ingredient.id)}
                  disabled={owned}
                  className="text-sm rounded-full px-3.5 py-2 font-medium"
                  style={{
                    background: owned ? "var(--color-accent-gold)" : "var(--color-surface)",
                    color: owned ? "#0b0b0f" : "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {owned ? "✓ " : "+ "}
                  {ingredient.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                background: i === step ? "var(--color-accent-gold)" : "var(--color-border)",
                transition: "width 0.2s",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (isLast ? complete() : setStep((s) => s + 1))}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {isLast ? "Commencer" : "Suivant"}
        </button>
      </div>
    </div>
  );
}
