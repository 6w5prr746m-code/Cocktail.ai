import type { Cocktail } from "./types";
import { tasteProfile } from "./tasteProfile";
import type { TranslationKey } from "./i18n/useTranslation";

// Suggestion d'accord mets-cocktail façon carte de bar — dérivée du même
// profil de goût que tasteProfile.ts (le tag prioritaire décide), pas d'un
// champ dédié. Retourne une clé de traduction (jamais de texte en dur ici)
// pour rester cohérent avec le reste du domaine i18n.
export function foodPairingKey(cocktail: Cocktail): TranslationKey {
  const primary = tasteProfile(cocktail)[0];
  switch (primary) {
    case "Sans alcool":
      return "foodPairing.sansAlcool";
    case "Pétillant":
      return "foodPairing.petillant";
    case "Frais":
      return "foodPairing.frais";
    case "Acidulé":
      return "foodPairing.acidule";
    case "Fruité":
      return "foodPairing.fruite";
    case "Sucré":
      return "foodPairing.sucre";
    case "Amer":
      return "foodPairing.amer";
    case "Corsé":
      return "foodPairing.corse";
    case "Réconfortant":
      return "foodPairing.reconfortant";
    default:
      return "foodPairing.default";
  }
}
