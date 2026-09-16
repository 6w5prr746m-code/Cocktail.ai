import { Link } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAlmostReadyMatches } from "../hooks/useAlmostReadyMatches";
import { useDismissedNudgesStore } from "../state/dismissedNudges";

const NUDGE_KEY = "almostReady";

export function AlmostReadyBanner() {
  const { t } = useTranslation();
  const matches = useAlmostReadyMatches();
  const dismiss = useDismissedNudgesStore((s) => s.dismiss);
  const isDismissed = useDismissedNudgesStore((s) => s.isDismissed(NUDGE_KEY));

  if (matches.length === 0 || isDismissed) return null;

  return (
    <div
      className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3 glass-card animate-fade-in"
      role="status"
    >
      <span className="text-2xl flex-shrink-0" aria-hidden>
        🧪
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {t("home.almostReadyBannerTitle", { count: matches.length })}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {t("home.almostReadyBannerBody")}
        </p>
      </div>
      <Link
        to="/mybar"
        className="flex-shrink-0 rounded-xl px-3 py-2 text-sm font-semibold"
        style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
      >
        {t("home.almostReadyBannerCta")}
      </Link>
      <button
        type="button"
        onClick={() => dismiss(NUDGE_KEY)}
        aria-label={t("home.almostReadyBannerDismissAria")}
        className="flex-shrink-0 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        ✕
      </button>
    </div>
  );
}
