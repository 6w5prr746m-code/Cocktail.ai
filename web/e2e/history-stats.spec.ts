import { test, expect } from "@playwright/test";

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

test("Profile shows preparation stats derived from history", async ({ page }) => {
  const entries = [
    { id: "1", cocktailId: "mojito", completedAt: isoDaysAgo(0) },
    { id: "2", cocktailId: "mojito", completedAt: isoDaysAgo(1) },
    { id: "3", cocktailId: "daiquiri", completedAt: isoDaysAgo(1) },
  ];

  await page.addInitScript((value) => {
    localStorage.setItem("cocktailai:onboarding", '{"state":{"completed":true},"version":0}');
    localStorage.setItem("cocktailai:history", JSON.stringify({ state: { entries: value }, version: 0 }));
  }, entries);

  await page.goto("/profile");

  await expect(page.getByText("Statistiques")).toBeVisible();
  await expect(page.getByText("Préparés").locator("..").getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByText(/🔥 2 j/)).toBeVisible(); // série en cours (aujourd'hui + hier)
  await expect(page.getByText("Ton cocktail favori — préparé 2 fois")).toBeVisible();
});

test("Profile hides the stats section when history is empty", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByText("Statistiques")).not.toBeVisible();
});
