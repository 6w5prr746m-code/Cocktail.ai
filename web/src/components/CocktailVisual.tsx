import { useEffect, useState } from "react";
import type { Cocktail } from "../domain/types";
import { artFor } from "../domain/glassArt";
import { gradientClassFor } from "../domain/gradient";
import { assetUrl } from "../domain/assetUrl";
import { GlassArt } from "./GlassArt";

export type PhotoVariant = "thumb" | "full";

// Une photo réaliste existe-t-elle pour ce cocktail ? Résolu une seule fois
// par id+variante et mis en cache — évite de re-tenter le chargement à
// chaque montage (carte dans une liste, etc.). Tant qu'aucune photo n'est
// déposée dans public/images/cocktails/, tout retombe silencieusement sur
// l'illustration existante : c'est un enrichissement progressif, pas un
// remplacement obligatoire.
const photoStatusCache = new Map<string, boolean>();

function photoPath(cocktailId: string, variant: PhotoVariant): string {
  return `images/cocktails/${cocktailId}${variant === "thumb" ? "-thumb" : ""}.webp`;
}

function usePhotoUrl(cocktailId: string, variant: PhotoVariant): string | null {
  const cacheKey = `${cocktailId}:${variant}`;
  const cached = photoStatusCache.get(cacheKey);
  const [available, setAvailable] = useState<boolean | null>(cached ?? null);
  const url = assetUrl(photoPath(cocktailId, variant));

  useEffect(() => {
    if (photoStatusCache.has(cacheKey)) {
      setAvailable(photoStatusCache.get(cacheKey)!);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      photoStatusCache.set(cacheKey, true);
      setAvailable(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      photoStatusCache.set(cacheKey, false);
      setAvailable(false);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [cacheKey, url]);

  return available ? url : null;
}

interface CocktailVisualProps {
  cocktail: Cocktail;
  /** Taille de l'illustration de secours (verre dessiné), utilisée tant qu'aucune photo n'existe. */
  glassSize?: number;
  className?: string;
  /** "thumb" (480px) pour les cartes/listes, "full" (960px) pour une mise en avant plus grande — voir scripts/optimize-images.mjs. */
  variant?: PhotoVariant;
  /** Diffère le chargement de l'image tant qu'elle n'approche pas du viewport (cartes hors écran). */
  lazy?: boolean;
}

/** Remplit son conteneur (w-full h-full) : photo réaliste si disponible, sinon dégradé de marque + illustration de verre. */
export function CocktailVisual({ cocktail, glassSize = 56, className = "", variant = "full", lazy = false }: CocktailVisualProps) {
  const photoUrl = usePhotoUrl(cocktail.id, variant);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={cocktail.name}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const art = artFor(cocktail);
  return (
    <div className={`relative w-full h-full flex items-center justify-center ${gradientClassFor(cocktail.category)} ${className}`}>
      <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.5), transparent 60%)" }} />
      <div style={{ color: "rgba(255,255,255,0.9)" }}>
        <GlassArt art={art} size={glassSize} strokeColor="rgba(255,255,255,0.9)" />
      </div>
    </div>
  );
}
