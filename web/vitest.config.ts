import { defineConfig } from "vitest/config";

// Config de test séparée de vite.config.ts : les tests unitaires du domaine
// (moteur de matching, formatage...) sont des fonctions pures, elles n'ont
// besoin ni du plugin React/Tailwind ni du plugin PWA pour tourner.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
