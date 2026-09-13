import type { GlassShape } from "./glassArt";

// Géométrie des verres, viewBox 0 0 120 160. `bowlPath` sert à la fois de
// zone de remplissage (clip) et de silhouette du contenant liquide ;
// `extraOutline` ajoute les éléments qui ne contiennent pas de liquide
// (pied, anse...). `liquidTopY`/`liquidBottomY` bornent la hauteur de
// remplissage utilisée pour l'animation (0 = vide, 1 = plein).
export interface GlassGeometry {
  bowlPath: string;
  extraOutline?: string[];
  liquidTopY: number;
  liquidBottomY: number;
  rimY: number;
  rimCenterX: number;
  rimHalfWidth: number;
}

export const GLASS_GEOMETRY: Record<GlassShape, GlassGeometry> = {
  highball: {
    bowlPath: "M 40 12 L 82 12 L 76 148 Q 76 154 70 154 L 52 154 Q 46 154 46 148 Z",
    liquidTopY: 12,
    liquidBottomY: 148,
    rimY: 12,
    rimCenterX: 61,
    rimHalfWidth: 21,
  },
  rocks: {
    bowlPath: "M 32 52 L 90 52 L 84 146 Q 84 152 78 152 L 44 152 Q 38 152 38 146 Z",
    liquidTopY: 52,
    liquidBottomY: 146,
    rimY: 52,
    rimCenterX: 61,
    rimHalfWidth: 29,
  },
  coupe: {
    bowlPath: "M 20 18 L 100 18 L 63 78 L 57 78 Z",
    extraOutline: ["M 60 78 L 60 118", "M 38 124 Q 60 116 82 124"],
    liquidTopY: 18,
    liquidBottomY: 76,
    rimY: 18,
    rimCenterX: 60,
    rimHalfWidth: 40,
  },
  wine: {
    bowlPath: "M 22 20 Q 20 60 40 72 Q 60 80 80 72 Q 100 60 98 20 Z",
    extraOutline: ["M 60 78 L 60 116", "M 40 122 Q 60 114 80 122"],
    liquidTopY: 20,
    liquidBottomY: 68,
    rimY: 20,
    rimCenterX: 60,
    rimHalfWidth: 39,
  },
  hurricane: {
    bowlPath: "M 28 14 L 92 14 L 78 70 Q 60 90 62 110 L 66 140 Q 60 150 54 140 L 58 110 Q 60 90 42 70 Z",
    liquidTopY: 14,
    liquidBottomY: 140,
    rimY: 14,
    rimCenterX: 60,
    rimHalfWidth: 32,
  },
  mug: {
    bowlPath: "M 34 40 L 86 40 L 82 140 Q 82 148 74 148 L 46 148 Q 38 148 38 140 Z",
    extraOutline: ["M 86 62 Q 112 62 112 88 Q 112 112 86 110"],
    liquidTopY: 40,
    liquidBottomY: 140,
    rimY: 40,
    rimCenterX: 60,
    rimHalfWidth: 26,
  },
  margarita: {
    bowlPath: "M 10 20 L 110 20 L 63 74 L 57 74 Z",
    extraOutline: ["M 60 74 L 60 110", "M 36 118 Q 60 110 84 118"],
    liquidTopY: 20,
    liquidBottomY: 72,
    rimY: 20,
    rimCenterX: 60,
    rimHalfWidth: 50,
  },
};
