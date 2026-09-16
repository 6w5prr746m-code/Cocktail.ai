import { Link } from "react-router-dom";

interface BrandMarkProps {
  className?: string;
}

// Marque "Cocktail.ai" — remplace l'emoji 🍸 par une icône propre à l'app
// (même géométrie de verre coupe que GLASS_GEOMETRY.coupe, voir
// glassShapes.ts, pour rester cohérent avec l'illustration des cocktails)
// et un texte en dégradé or animé au survol. Voir les classes .brand-mark-*
// dans index.css pour les transitions (jamais de boucle — seulement au survol).
export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <Link to="/" className={`brand-mark group inline-flex items-center gap-2.5 ${className}`}>
      <svg width={22} height={29} viewBox="0 0 120 160" aria-hidden className="brand-mark-icon flex-shrink-0">
        <defs>
          <linearGradient id="brandMarkGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-gold-soft)" />
            <stop offset="100%" stopColor="var(--color-accent-gold)" />
          </linearGradient>
        </defs>
        <path
          d="M 20 18 L 100 18 L 63 78 L 57 78 Z"
          fill="url(#brandMarkGold)"
          fillOpacity={0.22}
          stroke="url(#brandMarkGold)"
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M 60 78 L 60 118" stroke="url(#brandMarkGold)" strokeWidth={5} strokeLinecap="round" />
        <path d="M 38 124 Q 60 116 82 124" stroke="url(#brandMarkGold)" strokeWidth={5} strokeLinecap="round" fill="none" />
      </svg>
      <span className="brand-mark-text text-xl italic font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Cocktail.ai
      </span>
    </Link>
  );
}
