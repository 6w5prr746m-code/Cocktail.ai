import { useMemo } from "react";
import { ACHIEVEMENTS, type Achievement, type AchievementContext, type AchievementId } from "../domain/achievements";
import { computeHistoryStats } from "../domain/historyStats";
import { hasCompletedAnyMonthlyChallenge } from "../domain/monthlyChallenge";
import { hasNotableCreator } from "../domain/notableCreators";
import { isSignatureRecipe } from "../domain/signatureRecipe";
import { hasCompletedAnyWeeklyChallenge } from "../domain/weeklyChallenge";
import { useAllCocktails } from "../domain/catalog";
import { useFavoritesStore } from "../state/favorites";
import { useHistoryStore } from "../state/history";
import { useMyBarStore } from "../state/myBar";
import { useUserRecipesStore } from "../state/userRecipes";
import { useAchievementsSeenStore } from "../state/achievements";

interface UseAchievementsResult {
  all: Achievement[];
  unlockedIds: Set<AchievementId>;
  newlyUnlocked: Achievement[];
  acknowledge: (ids: AchievementId[]) => void;
}

/** Combine les stores persistés pertinents en un AchievementContext, dérive les badges débloqués, et isole ceux jamais vus (pour le toast) par rapport à `cocktailai:achievements-seen`. */
export function useAchievements(): UseAchievementsResult {
  const cocktails = useAllCocktails();
  const history = useHistoryStore((s) => s.entries);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const myBarEntries = useMyBarStore((s) => s.entries);
  const userRecipes = useUserRecipesStore((s) => s.recipes);
  const seenIds = useAchievementsSeenStore((s) => s.seenIds);
  const markSeen = useAchievementsSeenStore((s) => s.markSeen);

  const context: AchievementContext = useMemo(() => {
    const stats = computeHistoryStats(history, cocktails);
    const distinctMainSpiritsPrepared = new Set(
      history
        .map((e) => cocktails.find((c) => c.id === e.cocktailId)?.mainSpirit)
        .filter((spirit): spirit is string => Boolean(spirit)),
    ).size;
    const notableCocktailsPreparedCount = new Set(history.map((e) => e.cocktailId).filter(hasNotableCreator)).size;
    return {
      totalPrepared: stats.totalCount,
      longestStreakDays: stats.longestStreakDays,
      distinctMainSpiritsPrepared,
      favoritesCount: favoriteIds.length,
      myBarIngredientCount: Object.keys(myBarEntries).length,
      userRecipesCount: userRecipes.length,
      weeklyChallengeEverCompleted: hasCompletedAnyWeeklyChallenge(history, cocktails),
      monthlyChallengeEverCompleted: hasCompletedAnyMonthlyChallenge(history, cocktails),
      notableCocktailsPreparedCount,
      hasSignatureRecipe: userRecipes.some((recipe) => isSignatureRecipe(recipe, history)),
    };
  }, [history, cocktails, favoriteIds, myBarEntries, userRecipes]);

  const unlocked = useMemo(() => ACHIEVEMENTS.filter((a) => a.isUnlocked(context)), [context]);
  const unlockedIds = useMemo(() => new Set(unlocked.map((a) => a.id)), [unlocked]);
  const newlyUnlocked = useMemo(() => unlocked.filter((a) => !seenIds.includes(a.id)), [unlocked, seenIds]);

  return { all: ACHIEVEMENTS, unlockedIds, newlyUnlocked, acknowledge: markSeen };
}
