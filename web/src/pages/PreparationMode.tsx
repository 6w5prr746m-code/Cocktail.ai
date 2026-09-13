import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { useCocktail } from "../domain/catalog";
import { gradientClassFor } from "../domain/gradient";
import { useHistoryStore } from "../state/history";

export default function PreparationModePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cocktail = useCocktail(id);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((lock) => (wakeLockRef.current = lock)).catch(() => {});
    }
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const currentStep = cocktail?.steps[stepIndex];

  useEffect(() => {
    setElapsedSeconds(0);
    if (!currentStep?.durationSeconds) return;
    const start = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.min((Date.now() - start) / 1000, currentStep.durationSeconds!));
    }, 100);
    return () => window.clearInterval(interval);
  }, [stepIndex, currentStep]);

  if (!cocktail) {
    return (
      <div className="p-4">
        <p style={{ color: "var(--color-text-secondary)" }}>Cocktail introuvable.</p>
      </div>
    );
  }

  function handleNext() {
    if (!cocktail) return;
    if (stepIndex < cocktail.steps.length - 1) {
      setStepIndex((i) => i + 1);
      if (navigator.vibrate) navigator.vibrate(15);
    } else {
      setDone(true);
      addHistoryEntry(cocktail.id);
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 text-center gap-4">
        <span className="text-6xl">🍸</span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Ton {cocktail.name} est prêt !
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Santé 🥂
        </p>
        <button
          type="button"
          onClick={() => navigate(`/cocktail/${cocktail.id}`)}
          className="mt-4 rounded-2xl px-6 py-3 font-semibold"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          Retour à la fiche
        </button>
      </div>
    );
  }

  const progress = (stepIndex + 1) / cocktail.steps.length;

  return (
    <div className={`flex flex-col min-h-full ${gradientClassFor(cocktail.category)}`}>
      <div className="p-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full flex items-center justify-center"
          style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)", color: "white" }}
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <p className="text-white/70 text-sm font-medium">
          Étape {stepIndex + 1} / {cocktail.steps.length}
        </p>

        {currentStep?.durationSeconds ? (
          <CompatibilityRing
            fraction={elapsedSeconds / currentStep.durationSeconds}
            size={140}
            strokeWidth={10}
            visualLabelOverride={`${Math.ceil(currentStep.durationSeconds - elapsedSeconds)}s`}
          />
        ) : (
          <span className="text-6xl">🍸</span>
        )}

        <p className="text-xl font-semibold text-white leading-snug">{currentStep?.instruction}</p>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${progress * 100}%`, transition: "width 0.3s" }} />
        </div>
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {stepIndex < cocktail.steps.length - 1 ? "Valider l'étape" : "Terminer"}
        </button>
      </div>
    </div>
  );
}
