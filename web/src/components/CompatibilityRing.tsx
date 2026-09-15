import { useTranslation } from "../domain/i18n/useTranslation";

interface CompatibilityRingProps {
  fraction: number; // 0..1
  size?: number;
  strokeWidth?: number;
  label?: string;
  visualLabelOverride?: string;
}

export function CompatibilityRing({
  fraction,
  size = 96,
  strokeWidth = 8,
  label,
  visualLabelOverride,
}: CompatibilityRingProps) {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(1, fraction));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const center = size / 2;
  const displayLabel = visualLabelOverride ?? `${Math.round(clamped * 100)}%`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? t("compatibility.aria", { percent: Math.round(clamped * 100) })}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-accent-gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
        />
      </svg>
      <span
        className="absolute font-semibold"
        style={{ color: "var(--color-text-primary)", fontSize: size * 0.22, fontFamily: "var(--font-mono)" }}
      >
        {displayLabel}
      </span>
    </div>
  );
}
