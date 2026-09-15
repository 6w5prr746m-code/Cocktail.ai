import { useTranslation } from "../domain/i18n/useTranslation";

export function DifficultyDots({ level, size = 6 }: { level: 1 | 2 | 3; size?: number }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={t("difficulty.aria", { level })}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: size,
            height: size,
            background: i <= level ? "var(--color-accent-gold)" : "var(--color-border)",
          }}
        />
      ))}
    </span>
  );
}
