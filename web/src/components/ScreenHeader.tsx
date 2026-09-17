import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  action?: ReactNode;
  transparent?: boolean;
}

export function ScreenHeader({ title, onBack, action, transparent = false }: ScreenHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <header
      className="app-chrome sticky top-0 z-10 flex items-center justify-between px-3 py-3"
      style={{
        background: transparent ? "transparent" : "var(--color-bg)",
        borderBottom: transparent ? "none" : "1px solid var(--color-border)",
      }}
    >
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "var(--color-surface)", color: "var(--color-text-primary)" }}
        aria-label={t("common.back")}
      >
        ←
      </button>
      {title && (
        <h1 className="text-base font-semibold truncate px-2" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h1>
      )}
      <div className="flex items-center justify-end" style={{ minWidth: 36 }}>
        {action}
      </div>
    </header>
  );
}
