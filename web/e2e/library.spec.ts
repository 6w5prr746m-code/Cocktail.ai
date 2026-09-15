import { test, expect } from "@playwright/test";

async function totalCount(page: import("@playwright/test").Page): Promise<number> {
  const text = await page.getByText(/Tous les cocktails \(\d+\)/).textContent();
  return Number(text?.match(/\((\d+)\)/)?.[1]);
}

test("library search filters by name and ingredient", async ({ page }) => {
  await page.goto("/library");
  const fullCount = await totalCount(page);
  expect(fullCount).toBeGreaterThan(100); // catalogue étendu (Sprint 10) + les recettes curatées

  await page.getByPlaceholder("Nom ou ingrédient (ex: citron)…").fill("espresso martini");
  await expect(page.getByText("Tous les cocktails (1)")).toBeVisible();
  await expect(page.getByText("Espresso Martini")).toBeVisible();

  await page.getByPlaceholder("Nom ou ingrédient (ex: citron)…").fill("citron vert");
  const count = await page.locator("text=/Tous les cocktails \\(\\d+\\)/").textContent();
  expect(count).not.toContain("(0)");
});

test("difficulty filter narrows the result grid", async ({ page }) => {
  await page.goto("/library");
  const fullCount = await totalCount(page);

  await page.getByText("⚙︎ Filtres").click();
  await page.getByRole("button", { name: "Facile", exact: true }).click();

  await expect(page.getByText(/Tous les cocktails \(\d+\)/)).toBeVisible();
  const count = await totalCount(page);
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(fullCount);
});
