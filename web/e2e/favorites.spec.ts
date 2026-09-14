import { test, expect } from "@playwright/test";

test("toggling a favorite on the detail page makes it show up in Favorites", async ({ page }) => {
  await page.goto("/cocktail/mojito");
  await expect(page.getByRole("heading", { name: "Mojito" })).toBeVisible();

  await page.getByTestId("favorite-button").click();

  // La fiche cocktail est plein écran (pas de tab bar) : on navigue directement.
  await page.goto("/favorites");
  await expect(page.locator('a[href="/cocktail/mojito"]')).toBeVisible();

  // Retrait : la liste redevient vide
  await page.goto("/cocktail/mojito");
  await page.getByTestId("favorite-button").click();
  await page.goto("/favorites");
  await expect(page.getByText("Aucun favori pour l'instant")).toBeVisible();
});
