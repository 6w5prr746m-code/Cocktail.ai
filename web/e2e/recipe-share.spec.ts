import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:4300";

const RECIPE = {
  id: "creation_maison",
  name: "Création Maison",
  category: "Classique",
  origin: "Ta création",
  history: null,
  difficulty: 2,
  mainSpirit: "Rhum",
  preparationTimeMinutes: 4,
  glassware: "Verre à cocktail",
  iceType: "Glaçons",
  garnish: "Feuille de menthe",
  tips: "Servir très frais.",
  imageURL: "",
  ingredients: [{ ingredientId: "sirop_de_gingembre_maison", quantity: 2, unit: "cl", isOptional: false, role: "modifier" }],
  steps: [{ order: 1, instruction: "Secouer avec de la glace et filtrer.", durationSeconds: null }],
  variantIds: [],
  isUserCreated: true,
};

const CUSTOM_INGREDIENT = { id: "sirop_de_gingembre_maison", name: "Sirop de gingembre maison", category: "Autre", colorHex: null };

test("sharing a custom recipe produces a self-contained link a fresh browser can open and save", async ({ browser }) => {
  const sharer = await browser.newContext({
    baseURL: BASE_URL,
    permissions: ["clipboard-read", "clipboard-write"],
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            { name: "cocktailai:onboarding", value: '{"state":{"completed":true},"version":0}' },
            { name: "cocktailai:user-recipes", value: JSON.stringify({ state: { recipes: [RECIPE] }, version: 0 }) },
            {
              name: "cocktailai:custom-ingredients",
              value: JSON.stringify({ state: { byId: { [CUSTOM_INGREDIENT.id]: CUSTOM_INGREDIENT } }, version: 0 }),
            },
          ],
        },
      ],
    },
  });
  const sharerPage = await sharer.newPage();
  // navigator.share existe parfois en Chromium headless et court-circuiterait
  // le presse-papier — on le désactive pour un test déterministe.
  await sharerPage.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  await sharerPage.goto(`${BASE_URL}/cocktail/${RECIPE.id}/share`);
  await sharerPage.getByRole("button", { name: /Copier le lien de la recette/ }).click();
  await expect(sharerPage.getByText("✓ Lien copié")).toBeVisible();

  const clipboardText = await sharerPage.evaluate(() => navigator.clipboard.readText());
  const sharedPath = new URL(clipboardText).pathname;
  expect(sharedPath).toMatch(/^\/shared\//);

  const recipient = await browser.newContext({
    baseURL: BASE_URL,
    storageState: {
      cookies: [],
      origins: [{ origin: BASE_URL, localStorage: [{ name: "cocktailai:onboarding", value: '{"state":{"completed":true},"version":0}' }] }],
    },
  });
  const recipientPage = await recipient.newPage();

  await recipientPage.goto(`${BASE_URL}${sharedPath}`);
  await expect(recipientPage.getByText("Recette partagée")).toBeVisible();
  await expect(recipientPage.getByRole("heading", { name: "Création Maison" })).toBeVisible();
  // Le destinataire n'a jamais eu cet ingrédient perso en local — son nom
  // vient intégralement du lien, pas d'une résolution locale.
  await expect(recipientPage.getByText("Sirop de gingembre maison", { exact: true })).toBeVisible();

  await recipientPage.getByRole("button", { name: "Enregistrer dans mes recettes" }).click();
  await expect(recipientPage).toHaveURL(new RegExp(`/cocktail/${RECIPE.id}$`));
  await expect(recipientPage.getByText("Sirop de gingembre maison", { exact: true })).toBeVisible();

  await sharer.close();
  await recipient.close();
});

test("an invalid shared-recipe link shows a friendly error instead of crashing", async ({ page }) => {
  await page.goto("/shared/not-a-valid-code");
  await expect(page.getByText("Ce lien de recette est invalide ou corrompu.")).toBeVisible();
});
