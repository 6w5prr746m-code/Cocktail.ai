import { test, expect } from "@playwright/test";

test("library search filters by name and ingredient", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByText("Tous les cocktails (14)")).toBeVisible();

  await page.getByPlaceholder("Nom ou ingrédient (ex: citron)…").fill("espresso");
  await expect(page.getByText("Tous les cocktails (1)")).toBeVisible();
  await expect(page.getByText("Espresso Martini")).toBeVisible();

  await page.getByPlaceholder("Nom ou ingrédient (ex: citron)…").fill("citron vert");
  const count = await page.locator("text=/Tous les cocktails \\(\\d+\\)/").textContent();
  expect(count).not.toContain("(0)");
});

test("difficulty filter narrows the result grid", async ({ page }) => {
  await page.goto("/library");
  await page.getByText("⚙︎ Filtres").click();
  await page.getByRole("button", { name: "Facile", exact: true }).click();

  await expect(page.getByText(/Tous les cocktails \(\d+\)/)).toBeVisible();
  const text = await page.getByText(/Tous les cocktails \(\d+\)/).textContent();
  const count = Number(text?.match(/\((\d+)\)/)?.[1]);
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(14);
});
