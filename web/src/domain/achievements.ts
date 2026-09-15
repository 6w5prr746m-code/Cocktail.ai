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
  | "challenger";

export interface AchievementContext {
  totalPrepared: number;
  /** Série la plus longue jamais atteinte (pas la série en cours) — un badge, une fois débloqué, ne doit jamais se "reperdre". */
  longestStreakDays: number;
  distinctMainSpiritsPrepared: number;
  favoritesCount: number;
  myBarIngredientCount: number;
  userRecipesCount: number;
  weeklyChallengeEverCompleted: boolean;
}

export interface Achievement {
  id: AchievementId;
  icon: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstSip", icon: "🍹", titleKey: "achievements.firstSip.title", descKey: "achievements.firstSip.desc", isUnlocked: (c) => c.totalPrepared >= 1 },
  { id: "regular", icon: "🍸", titleKey: "achievements.regular.title", descKey: "achievements.regular.desc", isUnlocked: (c) => c.totalPrepared >= 10 },
  { id: "mixologist", icon: "🏆", titleKey: "achievements.mixologist.title", descKey: "achievements.mixologist.desc", isUnlocked: (c) => c.totalPrepared >= 50 },
  { id: "streak3", icon: "🔥", titleKey: "achievements.streak3.title", descKey: "achievements.streak3.desc", isUnlocked: (c) => c.longestStreakDays >= 3 },
  { id: "streak7", icon: "🔥", titleKey: "achievements.streak7.title", descKey: "achievements.streak7.desc", isUnlocked: (c) => c.longestStreakDays >= 7 },
  { id: "explorer", icon: "🧭", titleKey: "achievements.explorer.title", descKey: "achievements.explorer.desc", isUnlocked: (c) => c.distinctMainSpiritsPrepared >= 5 },
  { id: "curator", icon: "❤️", titleKey: "achievements.curator.title", descKey: "achievements.curator.desc", isUnlocked: (c) => c.favoritesCount >= 10 },
  { id: "wellStocked", icon: "🗄️", titleKey: "achievements.wellStocked.title", descKey: "achievements.wellStocked.desc", isUnlocked: (c) => c.myBarIngredientCount >= 15 },
  { id: "creator", icon: "✍️", titleKey: "achievements.creator.title", descKey: "achievements.creator.desc", isUnlocked: (c) => c.userRecipesCount >= 1 },
  { id: "challenger", icon: "🎯", titleKey: "achievements.challenger.title", descKey: "achievements.challenger.desc", isUnlocked: (c) => c.weeklyChallengeEverCompleted },
];

export function computeUnlockedAchievements(context: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(context));
}
