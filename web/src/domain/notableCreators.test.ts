import { describe, expect, it } from "vitest";
import { getNotableCreator } from "./notableCreators";

describe("getNotableCreator", () => {
  it("resolves a known cocktail id in French", () => {
    expect(getNotableCreator("sazerac", "fr")).toEqual({
      creator: "Antoine Amédée Peychaud",
      year: "1838",
      place: "Nouvelle-Orléans, États-Unis",
    });
  });

  it("resolves the same cocktail id in English", () => {
    expect(getNotableCreator("sazerac", "en")).toEqual({
      creator: "Antoine Amédée Peychaud",
      year: "1838",
      place: "New Orleans, USA",
    });
  });

  it("returns undefined for a cocktail with no notable creator on record", () => {
    expect(getNotableCreator("mojito", "fr")).toBeUndefined();
  });
});
