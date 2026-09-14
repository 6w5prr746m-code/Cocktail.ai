import { test, expect } from "@playwright/test";

// Démarre sans le préréglage global "onboarding terminé" pour tester le
// premier lancement lui-même.
test.use({ storageState: { cookies: [], origins: [] } });

test("first-launch onboarding walks through the steps and seeds My Bar with a starter ingredient", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Bienvenue sur Cocktail.ai")).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();

  await expect(page.getByText("Dis-nous ce que tu as")).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();

  await expect(page.getByText("Garde Mon Bar à jour")).toBeVisible();
  const starterChip = page.getByRole("button", { name: /^\+ / }).first();
  const chipText = await starterChip.textContent();
  const ingredientName = chipText!.replace("+ ", "").trim();

  await starterChip.click();
  const clickedChip = page.getByRole("button", { name: `✓ ${ingredientName}`, exact: true });
  await expect(clickedChip).toBeVisible();
  await expect(clickedChip).toBeDisabled();

  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByText("Bienvenue sur Cocktail.ai")).not.toBeVisible();

  await page.goto("/mybar");
  await expect(page.getByText("Déjà dans ton bar (1)")).toBeVisible();
  await expect(page.getByText(ingredientName, { exact: true })).toBeVisible();
});

test("Passer skips onboarding immediately without adding any ingredient", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Bienvenue sur Cocktail.ai")).toBeVisible();
  await page.getByRole("button", { name: "Passer" }).click();
  await expect(page.getByText("Bienvenue sur Cocktail.ai")).not.toBeVisible();

  await page.goto("/mybar");
  await expect(page.getByText("Ton bar est encore vide")).toBeVisible();
});
