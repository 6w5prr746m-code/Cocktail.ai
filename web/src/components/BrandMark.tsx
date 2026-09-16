import { Link } from "react-router-dom";

interface BrandMarkProps {
  className?: string;
}

// Marque "Cocktail.ai" — variante "Apple-like" : tuile d'icône plate (même
// géométrie de verre coupe que GLASS_GEOMETRY.coupe, voir glassShapes.ts,
// pour rester cohérent avec l'illustration des cocktails) sur fond bleu
// système, wordmark en police système (pas de serif ni de dégradé). Voir
// les classes .brand-mark-* dans index.css pour les micro-interactions.
export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <Link to="/" className={`brand-mark group inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="brand-mark-icon flex items-center justify-center flex-shrink-0"
        style={{ width: 30, height: 30, borderRadius: 8, background: "#0A84FF", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      >
        <svg width={16} height={21} viewBox="0 0 120 160" aria-hidden>
          <path d="M 20 18 L 100 18 L 63 78 L 57 78 Z" fill="#fff" fillOpacity={0.95} />
          <path d="M 60 78 L 60 118" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
          <path d="M 38 124 Q 60 116 82 124" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="brand-mark-text text-[17px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-body)" }}>
        <span style={{ color: "var(--color-text-primary)" }}>Cocktail</span>
        <span style={{ color: "#0A84FF" }}>.ai</span>
      </span>
    </Link>
  );
}
