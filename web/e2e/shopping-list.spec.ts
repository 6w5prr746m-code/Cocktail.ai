import { test, expect } from "@playwright/test";

test("My Bar surfaces almost-ready cocktails and can build a shopping list from missing ingredients", async ({ page }) => {
  await page.goto("/mybar");

  // Rhum blanc + citron vert + menthe fraîche : il manque juste le sucre de
  // canne pour débloquer le Mojito (4 ingrédients requis).
  for (const name of ["Rhum blanc", "Citron vert", "Menthe fraîche"]) {
    await page.getByRole("button", { name: `+ ${name}`, exact: true }).click();
  }

  await expect(page.getByText("Presque prêt")).toBeVisible();
  const mojitoRow = page.locator('a[href="/cocktail/mojito"]').locator("..");
  await expect(mojitoRow.getByText(/Manque/)).toContainText("Sucre de canne");

  await mojitoRow.getByRole("button", { name: /Ajouter les ingrédients manquants/ }).click();
  await expect(page.getByText("🛒 Liste de courses")).toBeVisible();
  await expect(page.getByText("Sucre de canne", { exact: true })).toBeVisible();

  // Cocher un article le barre visuellement sans le retirer de la liste.
  const checkbox = page.getByRole("button", { name: "Cocher Sucre de canne" });
  await checkbox.click();
  await expect(page.getByText("Vider les cochés")).toBeVisible();
});

test("cocktail detail explains the score against My Bar and offers a quick add for missing ingredients", async ({ page }) => {
  await page.goto("/mybar");
  for (const name of ["Rhum blanc", "Citron vert", "Menthe fraîche"]) {
    await page.getByRole("button", { name: `+ ${name}`, exact: true }).click();
  }

  await page.goto("/cocktail/mojito");
  await expect(page.getByText("avec Mon Bar")).toBeVisible();

  const missingRow = page.getByText("Sucre de canne", { exact: true }).locator("../../..");
  await expect(missingRow.getByLabel("Manquant")).toBeVisible();
  await missingRow.getByRole("button", { name: /Ajouter Sucre de canne/ }).click();

  await page.goto("/mybar");
  await expect(page.getByText("🛒 Liste de courses")).toBeVisible();
});
