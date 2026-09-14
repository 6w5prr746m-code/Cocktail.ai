import { useId } from "react";
import type { CocktailArt } from "../domain/glassArt";
import { GLASS_GEOMETRY } from "../domain/glassShapes";

interface GlassArtProps {
  art: CocktailArt;
  size?: number;
  /** 0..1 — niveau de remplissage. Par défaut ~0.62 (une belle mesure de bar, pas à ras bord). */
  fillFraction?: number;
  className?: string;
  glow?: boolean;
  strokeColor?: string;
}

export function GlassArt({
  art,
  size = 96,
  fillFraction = 0.62,
  className = "",
  glow = false,
  strokeColor = "var(--color-accent-gold)",
}: GlassArtProps) {
  const uid = useId();
  const geo = GLASS_GEOMETRY[art.shape];
  const clipId = `glass-clip-${uid}`;
  const clampedFill = Math.max(0, Math.min(1, fillFraction));
  const fillTopY = geo.liquidBottomY - clampedFill * (geo.liquidBottomY - geo.liquidTopY);
  const foamTopY = Math.max(geo.liquidTopY, fillTopY - 4);

  return (
    <svg
      viewBox="0 0 120 160"
      width={size}
      height={size * (160 / 120)}
      className={className}
      role="img"
      aria-hidden
      style={glow ? { filter: `drop-shadow(0 8px 24px ${art.liquidColor}55)` } : undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={geo.bowlPath} />
        </clipPath>
      </defs>

      {/* Liquide, découpé à la forme du verre */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={fillTopY} width={120} height={160 - fillTopY} fill={art.liquidColor} />
        {art.liquidColorSecondary && (
          <path
            d={`M 20 ${fillTopY} Q 45 ${fillTopY + 10} 30 ${fillTopY + 30} Q 20 ${fillTopY + 45} 40 ${fillTopY + 60} L 0 ${fillTopY + 60} L 0 ${fillTopY} Z`}
            fill={art.liquidColorSecondary}
            opacity={0.85}
          />
        )}
        <rect x={0} y={foamTopY} width={120} height={4} fill="#ffffff" opacity={0.22} />

        {art.ice === "cubes" && (
          <g fill="#ffffff" opacity={0.5}>
            <rect x={geo.rimCenterX - 16} y={fillTopY + 2} width={12} height={12} rx={2} transform={`rotate(-8 ${geo.rimCenterX - 10} ${fillTopY + 8})`} />
            <rect x={geo.rimCenterX + 2} y={fillTopY + 6} width={11} height={11} rx={2} transform={`rotate(10 ${geo.rimCenterX + 8} ${fillTopY + 11})`} />
          </g>
        )}
        {art.ice === "crushed" && (
          <g fill="#ffffff" opacity={0.55}>
            {[-14, -4, 8, 18, -20].map((dx, i) => (
              <circle key={i} cx={geo.rimCenterX + dx} cy={fillTopY + 3 + (i % 2) * 5} r={2.4} />
            ))}
          </g>
        )}
      </g>

      {/* Contour du verre */}
      <path d={geo.bowlPath} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
      {geo.extraOutline?.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      ))}

      {art.hot && (
        <g stroke={strokeColor} opacity={0.35} strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d={`M ${geo.rimCenterX - 10} ${geo.rimY - 6} Q ${geo.rimCenterX - 14} ${geo.rimY - 16} ${geo.rimCenterX - 8} ${geo.rimY - 24}`} />
          <path d={`M ${geo.rimCenterX + 6} ${geo.rimY - 6} Q ${geo.rimCenterX + 2} ${geo.rimY - 16} ${geo.rimCenterX + 8} ${geo.rimY - 26}`} />
        </g>
      )}

      <Garnish art={art} geo={geo} />
    </svg>
  );
}

function Garnish({ art, geo }: { art: CocktailArt; geo: (typeof GLASS_GEOMETRY)[keyof typeof GLASS_GEOMETRY] }) {
  const cx = geo.rimCenterX;
  const y = geo.rimY;

  switch (art.garnish) {
    case "mint":
      return (
        <g fill="#4caf6a" opacity={0.95}>
          <ellipse cx={cx + 12} cy={y - 4} rx={7} ry={3.4} transform={`rotate(-30 ${cx + 12} ${y - 4})`} />
          <ellipse cx={cx + 18} cy={y - 10} rx={6} ry={3} transform={`rotate(-15 ${cx + 18} ${y - 10})`} />
          <ellipse cx={cx + 7} cy={y - 11} rx={6} ry={3} transform={`rotate(-50 ${cx + 7} ${y - 11})`} />
        </g>
      );
    case "citrusWheel":
      return (
        <g transform={`translate(${cx + geo.rimHalfWidth * 0.55} ${y - 2})`}>
          <circle r={9} fill={art.garnishColor ?? "#e0a83a"} opacity={0.9} />
          <circle r={9} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
          {[0, 45, 90, 135].map((deg) => (
            <line key={deg} x1={-6} y1={0} x2={6} y2={0} stroke="#fff" strokeWidth={0.8} opacity={0.7} transform={`rotate(${deg})`} />
          ))}
        </g>
      );
    case "citrusTwist":
      return (
        <path
          d={`M ${cx - 4} ${y - 2} Q ${cx + 10} ${y - 12} ${cx + 2} ${y - 20} Q ${cx - 6} ${y - 26} ${cx + 6} ${y - 32}`}
          fill="none"
          stroke={art.garnishColor ?? "#e0a83a"}
          strokeWidth={3}
          strokeLinecap="round"
        />
      );
    case "cherry":
      return (
        <g>
          <line x1={cx + 6} y1={y - 4} x2={cx + 12} y2={y - 16} stroke="#7a2c2c" strokeWidth={1.4} />
          <circle cx={cx + 6} cy={y - 2} r={4.4} fill="#c62840" />
        </g>
      );
    case "pineapple":
      return (
        <g>
          <path d={`M ${cx - 4} ${y - 2} L ${cx + 12} ${y - 2} L ${cx + 4} ${y - 16} Z`} fill="#f2c14e" />
          <path d={`M ${cx + 4} ${y - 16} Q ${cx} ${y - 24} ${cx - 2} ${y - 30}`} fill="none" stroke="#4caf6a" strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M ${cx + 4} ${y - 16} Q ${cx + 6} ${y - 24} ${cx + 9} ${y - 29}`} fill="none" stroke="#4caf6a" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    case "cinnamon":
      return <rect x={cx - 2} y={y - 22} width={5} height={24} rx={2} fill="#8a5a2c" transform={`rotate(18 ${cx} ${y - 10})`} />;
    case "saltRim":
      return (
        <g fill="#ffffff" opacity={0.85}>
          {Array.from({ length: 10 }).map((_, i) => {
            const t = i / 9;
            const dx = -geo.rimHalfWidth + t * geo.rimHalfWidth * 2;
            return <circle key={i} cx={cx + dx} cy={y - 1} r={1.3} />;
          })}
        </g>
      );
    case "olive":
      return (
        <g>
          <line x1={cx} y1={y - 2} x2={cx + 10} y2={y - 18} stroke="#c9a227" strokeWidth={1.2} />
          <ellipse cx={cx + 4} cy={y - 6} rx={4.2} ry={3} fill="#7a8c3f" transform={`rotate(-20 ${cx + 4} ${y - 6})`} />
        </g>
      );
    case "coffeeBeans":
      return (
        <g fill="#5b3a22">
          <ellipse cx={cx - 4} cy={y - 6} rx={4} ry={2.6} transform={`rotate(-20 ${cx - 4} ${y - 6})`} />
          <ellipse cx={cx + 5} cy={y - 4} rx={4} ry={2.6} transform={`rotate(15 ${cx + 5} ${y - 4})`} />
        </g>
      );
    case "berries":
      return (
        <g fill="#5c1f42">
          <circle cx={cx + 4} cy={y - 4} r={3.2} />
          <circle cx={cx + 12} cy={y - 8} r={2.8} />
          <circle cx={cx + 10} cy={y - 1} r={2.6} />
        </g>
      );
    default:
      return null;
  }
}
