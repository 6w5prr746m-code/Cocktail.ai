import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { registerInstallPromptListeners } from "./state/installPrompt.ts";

// BASE_URL vaut "/" en dev et reflète le --base passé au build en prod
// (ex: "/Cocktail.ai/" sur GitHub Pages) — permet à basename de s'adapter
// sans configuration en dur.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

registerInstallPromptListeners();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
