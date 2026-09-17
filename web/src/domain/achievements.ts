import {
  Martini,
  Wine,
  Trophy,
  Flame,
  Compass,
  Heart,
  Archive,
  PenLine,
  Target,
  Medal,
  Award,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "./i18n/useTranslation";

export type AchievementId =
  | "firstSip"
  | "regular"
  | "mixologist"
  | "streak3"
  | "streak7"
  | "explorer"
  | "curator"
  | "wellStocked"
  | "creator"
  | "challenger"
  | "monthlyChallenger"
  | "connoisseur"
  | "signatureCreator";

export interface AchievementContext {
  totalPrepared: number;
  /** Série la plus longue jamais atteinte (pas la série en cours) — un badge, une fois débloqué, ne doit jamais se "reperdre". */
  longestStreakDays: number;
  distinctMainSpiritsPrepared: number;
  favoritesCount: number;
  myBarIngredientCount: number;
  userRecipesCount: number;
  weeklyChallengeEverCompleted: boolean;
  monthlyChallengeEverCompleted: boolean;
  /** Nombre de cocktails distincts préparés parmi ceux créés par un bartender reconnu (voir notableCreators.ts). */
  notableCocktailsPreparedCount: number;
  /** Au moins une recette perso a atteint le statut "signature" (voir signatureRecipe.ts). */
  hasSignatureRecipe: boolean;
}

export interface Achievement {
  id: AchievementId;
  /** Icône vectorielle utilisée partout à l'écran (toast, Profil). */
  icon: LucideIcon;
  /** Emoji utilisé uniquement pour la carte de partage dessinée en <canvas> (ShareCardModal) — un composant React ne peut pas être passé à `ctx.fillText`. */
  emoji: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstSip", icon: Martini, emoji: "🍹", titleKey: "achievements.firstSip.title", descKey: "achievements.firstSip.desc", isUnlocked: (c) => c.totalPrepared >= 1 },
  { id: "regular", icon: Wine, emoji: "🍸", titleKey: "achievements.regular.title", descKey: "achievements.regular.desc", isUnlocked: (c) => c.totalPrepared >= 10 },
  { id: "mixologist", icon: Trophy, emoji: "🏆", titleKey: "achievements.mixologist.title", descKey: "achievements.mixologist.desc", isUnlocked: (c) => c.totalPrepared >= 50 },
  { id: "streak3", icon: Flame, emoji: "🔥", titleKey: "achievements.streak3.title", descKey: "achievements.streak3.desc", isUnlocked: (c) => c.longestStreakDays >= 3 },
  { id: "streak7", icon: Flame, emoji: "🔥", titleKey: "achievements.streak7.title", descKey: "achievements.streak7.desc", isUnlocked: (c) => c.longestStreakDays >= 7 },
  { id: "explorer", icon: Compass, emoji: "🧭", titleKey: "achievements.explorer.title", descKey: "achievements.explorer.desc", isUnlocked: (c) => c.distinctMainSpiritsPrepared >= 5 },
  { id: "curator", icon: Heart, emoji: "❤️", titleKey: "achievements.curator.title", descKey: "achievements.curator.desc", isUnlocked: (c) => c.favoritesCount >= 10 },
  { id: "wellStocked", icon: Archive, emoji: "🗄️", titleKey: "achievements.wellStocked.title", descKey: "achievements.wellStocked.desc", isUnlocked: (c) => c.myBarIngredientCount >= 15 },
  { id: "creator", icon: PenLine, emoji: "✍️", titleKey: "achievements.creator.title", descKey: "achievements.creator.desc", isUnlocked: (c) => c.userRecipesCount >= 1 },
  { id: "challenger", icon: Target, emoji: "🎯", titleKey: "achievements.challenger.title", descKey: "achievements.challenger.desc", isUnlocked: (c) => c.weeklyChallengeEverCompleted },
  { id: "monthlyChallenger", icon: Medal, emoji: "🏅", titleKey: "achievements.monthlyChallenger.title", descKey: "achievements.monthlyChallenger.desc", isUnlocked: (c) => c.monthlyChallengeEverCompleted },
  { id: "connoisseur", icon: Award, emoji: "🏆", titleKey: "achievements.connoisseur.title", descKey: "achievements.connoisseur.desc", isUnlocked: (c) => c.notableCocktailsPreparedCount >= 3 },
  { id: "signatureCreator", icon: Sparkles, emoji: "✨", titleKey: "achievements.signatureCreator.title", descKey: "achievements.signatureCreator.desc", isUnlocked: (c) => c.hasSignatureRecipe },
];

export function computeUnlockedAchievements(context: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(context));
}
