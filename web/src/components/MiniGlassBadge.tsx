import type { Cocktail } from "../domain/types";
import { CocktailVisual } from "./CocktailVisual";

export function MiniGlassBadge({ cocktail, size = 48 }: { cocktail: Cocktail; size?: number }) {
  return (
    <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: size, height: size }}>
      <CocktailVisual cocktail={cocktail} glassSize={size * 0.6} variant="thumb" lazy />
    </div>
  );
}
