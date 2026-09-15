import { useLocaleStore } from "../state/locale";

/** Plein écran, affiché une seule fois avant tout le reste (y compris l'onboarding, dont le texte dépend de la langue choisie ici). */
export function LanguagePicker() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  if (locale !== null) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 px-8 animate-fade-in"
      style={{ background: "var(--color-bg)", maxWidth: 560, margin: "0 auto" }}
    >
      <span style={{ fontSize: 40 }} aria-hidden>
        🍸
      </span>
      <div className="text-center">
        <p className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Choisis ta langue
        </p>
        <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Choose your language
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={() => setLocale("fr")}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          🇫🇷 Français
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
        >
          🇬🇧 English
        </button>
      </div>
    </div>
  );
}
