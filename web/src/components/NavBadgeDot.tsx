// Petit point d'alerte superposé à une icône de nav (ex: cocktails "presque
// prêts" dans Mon Bar) — purement visuel, aria-hidden : l'information doit
// être portée par le texte/aria-label du contenu qu'il annonce, pas ce point.
export function NavBadgeDot() {
  return (
    <span
      aria-hidden
      className="absolute rounded-full"
      style={{ top: -2, right: -4, width: 8, height: 8, background: "var(--color-danger-text)" }}
    />
  );
}
