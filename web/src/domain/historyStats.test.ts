import { describe, expect, it } from "vitest";
import { computeHistoryStats } from "./historyStats";
import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

function cocktail(id: string): Cocktail {
  return {
    id,
    name: id,
    category: "Test",
    origin: "Test",
    history: null,
    difficulty: 1,
    mainSpirit: "Test",
    preparationTimeMinutes: 3,
    glassware: "Verre",
    iceType: "Glaçons",
    garnish: "Aucune",
    tips: null,
    imageURL: "",
    ingredients: [],
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

function entry(cocktailId: string, daysAgo: number, hour = 20): HistoryEntry {
  const d = new Date(2026, 5, 15, hour); // 15 juin 2026, fixe pour des tests déterministes
  d.setDate(d.getDate() - daysAgo);
  return { id: `${cocktailId}-${daysAgo}-${hour}`, cocktailId, completedAt: d.toISOString() };
}

const NOW = new Date(2026, 5, 15, 22); // même jour de référence que `entry`, en fin de soirée

describe("computeHistoryStats", () => {
  it("returns all-zero stats for an empty history", () => {
    const stats = computeHistoryStats([], [cocktail("mojito")], NOW);
    expect(stats).toEqual({ totalCount: 0, monthlyCount: 0, currentStreakDays: 0, longestStreakDays: 0, mostPrepared: null });
  });

  it("counts total and monthly entries", () => {
    const entries = [entry("mojito", 0), entry("mojito", 1), entry("mojito", 40)]; // le 3e est le mois précédent
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.totalCount).toBe(3);
    expect(stats.monthlyCount).toBe(2);
  });

  it("finds the most prepared cocktail, ignoring deleted ones", () => {
    const entries = [entry("mojito", 0), entry("mojito", 1), entry("daiquiri", 2), entry("deleted_recipe", 3)];
    const stats = computeHistoryStats(entries, [cocktail("mojito"), cocktail("daiquiri")], NOW);
    expect(stats.mostPrepared).toEqual({ cocktail: cocktail("mojito"), count: 2 });
  });

  it("keeps the current streak alive when today already has an entry", () => {
    const entries = [entry("mojito", 0), entry("mojito", 1), entry("mojito", 2)];
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.currentStreakDays).toBe(3);
  });

  it("keeps the current streak alive when yesterday has an entry but today doesn't yet", () => {
    const entries = [entry("mojito", 1), entry("mojito", 2)];
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.currentStreakDays).toBe(2);
  });

  it("breaks the current streak once a full day has been skipped", () => {
    const entries = [entry("mojito", 2), entry("mojito", 3)];
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.currentStreakDays).toBe(0);
  });

  it("counts multiple preparations on the same day as a single streak day", () => {
    const entries = [entry("mojito", 0, 12), entry("mojito", 0, 20)];
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.currentStreakDays).toBe(1);
  });

  it("finds the longest streak even if it isn't the current one", () => {
    const entries = [
      entry("mojito", 0), // série actuelle : juste 1 jour
      entry("mojito", 10),
      entry("mojito", 11),
      entry("mojito", 12),
      entry("mojito", 13), // ancienne série de 4 jours consécutifs
    ];
    const stats = computeHistoryStats(entries, [cocktail("mojito")], NOW);
    expect(stats.currentStreakDays).toBe(1);
    expect(stats.longestStreakDays).toBe(4);
  });
});
