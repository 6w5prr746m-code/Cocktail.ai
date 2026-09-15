import { test, expect } from "@playwright/test";

// Démarre sans préréglage de langue pour tester le sélecteur de première
// connexion lui-même (mais avec l'onboarding déjà marqué terminé pour ne
// pas mélanger les deux flux plein écran dans le même test).
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:4300",
        localStorage: [{ name: "cocktailai:onboarding", value: '{"state":{"completed":true},"version":0}' }],
      },
    ],
  },
});

test("first launch shows the language picker and choosing English localizes the interface", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Choisis ta langue")).toBeVisible();
  await page.getByRole("button", { name: /English/ }).click();

  await expect(page.getByRole("heading", { name: "What do you feel like drinking tonight?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
});

test("language toggle in Profile switches the interface instantly, without reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /English/ }).click();
  await expect(page.getByRole("heading", { name: "What do you feel like drinking tonight?" })).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

  await page.getByRole("button", { name: "Français", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Que souhaites-tu boire ce soir ?" })).toBeVisible();
});

test("cocktail detail page renders translated ingredient names and steps in English", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /English/ }).click();

  await page.goto("/cocktail/mojito");
  await expect(page.getByRole("heading", { name: "Mojito" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
  await expect(page.getByText("White rum", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preparation" })).toBeVisible();
  await expect(page.getByText("Squeeze the lime half into the glass.")).toBeVisible();
});
