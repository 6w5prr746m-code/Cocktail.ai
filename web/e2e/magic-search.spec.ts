import { test, expect } from "@playwright/test";

test("magic ingredient search surfaces a matching cocktail and opens its detail", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Ajouter mes ingrédients").click();

  await expect(page.getByText("Sélectionne au moins 3 ingrédients")).toBeVisible();

  for (const ingredient of ["Rhum blanc", "Citron vert", "Menthe fraîche"]) {
    await page.getByRole("button", { name: ingredient, exact: true }).click();
  }

  const mojitoResult = page.locator('a[href="/cocktail/mojito"]');
  await expect(mojitoResult).toBeVisible();

  await mojitoResult.click();
  await expect(page.getByRole("heading", { name: "Mojito" })).toBeVisible();
  await expect(page.getByText("Rhum blanc", { exact: true })).toBeVisible();
});
