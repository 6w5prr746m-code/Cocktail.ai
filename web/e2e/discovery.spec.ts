import { test, expect } from "@playwright/test";

test("library search tolerates a typo in the cocktail name", async ({ page }) => {
  await page.goto("/library");
  const fullCountText = await page.getByText(/Tous les cocktails \(\d+\)/).textContent();

  await page.getByPlaceholder("Nom ou ingrédient (ex: citron)…").fill("mojto");
  await expect(page.getByText(/Tous les cocktails \(\d+\)/)).toBeVisible();
  const count = await page.getByText(/Tous les cocktails \(\d+\)/).textContent();
  expect(count).not.toContain("(0)");
  expect(count).not.toBe(fullCountText);
  await expect(page.getByText("Mojito", { exact: true })).toBeVisible();
});

test("Surprends-moi navigates straight to a cocktail detail page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Surprends-moi avec un cocktail au hasard" }).click();
  await expect(page).toHaveURL(/\/cocktail\/[a-z0-9_]+$/);
});

test("favoriting a cocktail surfaces a taste-based explanation on Recommandés pour toi", async ({ page }) => {
  await page.goto("/cocktail/mojito");
  await page.getByTestId("favorite-button").click();

  await page.goto("/");
  await expect(page.getByText("Basé sur tes favoris et cocktails déjà préparés")).toBeVisible();
});
