import { describe, expect, it } from "vitest";
import { getNotableCreator, hasNotableCreator, notableCocktailIds } from "./notableCreators";

describe("getNotableCreator", () => {
  it("resolves a known cocktail id in French, including its bio", () => {
    expect(getNotableCreator("sazerac", "fr")).toEqual({
      creator: "Antoine Amédée Peychaud",
      year: "1838",
      place: "Nouvelle-Orléans, États-Unis",
      bio: expect.stringContaining("Apothicaire créole"),
    });
  });

  it("resolves the same cocktail id in English, including its bio", () => {
    expect(getNotableCreator("sazerac", "en")).toEqual({
      creator: "Antoine Amédée Peychaud",
      year: "1838",
      place: "New Orleans, USA",
      bio: expect.stringContaining("Creole apothecary"),
    });
  });

  it("returns undefined for a cocktail with no notable creator on record", () => {
    expect(getNotableCreator("mojito", "fr")).toBeUndefined();
  });

  it("shares the same bio across two cocktails by the same creator", () => {
    expect(getNotableCreator("bramble", "fr")?.bio).toBe(getNotableCreator("espresso_martini", "fr")?.bio);
  });
});

describe("hasNotableCreator", () => {
  it("is true for a cocktail with a documented creator, false otherwise", () => {
    expect(hasNotableCreator("sazerac")).toBe(true);
    expect(hasNotableCreator("mojito")).toBe(false);
  });
});

describe("notableCocktailIds", () => {
  it("lists every documented cocktail id, including sazerac", () => {
    const ids = notableCocktailIds();
    expect(ids).toContain("sazerac");
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });
});
