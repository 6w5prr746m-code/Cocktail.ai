import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// En environnement de dev sandboxé, un Chromium complet est pré-installé à
// un chemin fixe (headless shell absent) — on le cible explicitement s'il
// existe. En CI (`npx playwright install`), rien de spécial n'est requis :
// Playwright résout son propre binaire normalement.
const sandboxChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:4300",
    trace: "on-first-retry",
    // Onboarding pré-marqué comme terminé par défaut pour tous les tests :
    // c'est l'écran de bienvenue plein écran (voir onboarding.spec.ts) qui
    // désactive ce préréglage pour tester le premier lancement lui-même.
    storageState: "e2e/storageState.json",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } }],
  webServer: {
    command: "npm run dev -- --port 4300 --strictPort",
    url: "http://localhost:4300",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
