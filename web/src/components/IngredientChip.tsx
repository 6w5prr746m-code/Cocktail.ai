interface IngredientChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  colorHex?: string | null;
}

export function IngredientChip({ label, selected = false, onClick, colorHex }: IngredientChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
      style={{
        background: selected ? "var(--color-accent-gold)" : "var(--color-surface)",
        color: selected ? "#0b0b0f" : "var(--color-text-primary)",
        border: `1px solid ${selected ? "var(--color-accent-gold)" : "var(--color-border)"}`,
      }}
      aria-pressed={selected}
    >
      {colorHex && (
        <span
          className="inline-block rounded-full"
          style={{ width: 8, height: 8, background: colorHex, opacity: selected ? 0.6 : 1 }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}
