import type { Cocktail } from "../domain/types";
import { artFor } from "../domain/glassArt";
import { gradientClassFor } from "../domain/gradient";
import { GlassArt } from "./GlassArt";

export function MiniGlassBadge({ cocktail, size = 48 }: { cocktail: Cocktail; size?: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl flex-shrink-0 ${gradientClassFor(cocktail.category)}`}
      style={{ width: size, height: size, color: "rgba(255,255,255,0.9)" }}
    >
      <GlassArt art={artFor(cocktail)} size={size * 0.6} strokeColor="rgba(255,255,255,0.9)" />
    </div>
  );
}
