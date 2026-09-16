import { test, expect } from "@playwright/test";

// Sprint 11 : coquille responsive (sidebar desktop / TabBar mobile-tablette).
// Le viewport par défaut (Desktop Chrome, ~1280px) dépasse déjà le seuil lg
// (1024px) — ces tests couvrent explicitement les deux côtés du seuil.

test("desktop viewport shows the sidebar nav and hides the bottom tab bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const sideNav = page.getByRole("navigation", { name: "Navigation principale (bureau)" });
  const tabBar = page.getByRole("navigation", { name: "Navigation principale (mobile)" });
  await expect(sideNav).toBeVisible();
  await expect(tabBar).toBeHidden();

  await sideNav.getByRole("link", { name: "Bibliothèque" }).click();
  await expect(page).toHaveURL(/\/library$/);
  // La sidebar reste affichée après la navigation (coquille persistante).
  await expect(sideNav.getByRole("link", { name: "Mon Bar" })).toBeVisible();
});

test("phone viewport shows the bottom tab bar and hides the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const sideNav = page.getByRole("navigation", { name: "Navigation principale (bureau)" });
  const tabBar = page.getByRole("navigation", { name: "Navigation principale (mobile)" });
  await expect(tabBar).toBeVisible();
  await expect(sideNav).toBeHidden();

  await tabBar.getByRole("link", { name: "Mon Bar" }).click();
  await expect(page).toHaveURL(/\/mybar$/);
  await expect(tabBar.getByRole("link", { name: "Favoris" })).toBeVisible();
});

test("cocktail detail's Préparer button stays above the tab bar on mobile after scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/cocktail/mojito");

  const prepareLink = page.getByRole("link", { name: "Préparer" });
  const tabBar = page.getByRole("navigation", { name: "Navigation principale (mobile)" });
  await expect(prepareLink).toBeVisible();
  await expect(tabBar).toBeVisible();

  const prepareBox = await prepareLink.boundingBox();
  const tabBarBox = await tabBar.boundingBox();
  expect(prepareBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  // Le bouton ne doit jamais chevaucher la TabBar : son bord bas doit rester
  // au-dessus (ou égal) du bord haut de la TabBar.
  expect(prepareBox!.y + prepareBox!.height).toBeLessThanOrEqual(tabBarBox!.y + 1);
});
