export function DifficultyDots({ level, size = 6 }: { level: 1 | 2 | 3; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Difficulté ${level} sur 3`}>
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
