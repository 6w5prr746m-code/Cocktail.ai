import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { AchievementToast } from "./components/AchievementToast";
import { LanguagePicker } from "./components/LanguagePicker";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TabBar } from "./components/TabBar";
import { SideNav } from "./components/SideNav";
import { applyThemeToDocument, useThemeStore } from "./state/theme";
import { applySkinToDocument, useCosmeticsStore } from "./state/cosmetics";

// Home reste chargée eagerly (page d'entrée quasi systématique) — le reste
// est découpé par route : chaque écran devient son propre chunk JS, chargé
// à la demande plutôt que tout d'un bloc au premier chargement.
import HomePage from "./pages/Home";
const LibraryPage = lazy(() => import("./pages/Library"));
const CollectionDetailPage = lazy(() => import("./pages/CollectionDetail"));
const MyBarPage = lazy(() => import("./pages/MyBar"));
const PartyPlannerPage = lazy(() => import("./pages/PartyPlanner"));
const CostingPage = lazy(() => import("./pages/Costing"));
const MenuBuilderPage = lazy(() => import("./pages/MenuBuilder"));
const MenuViewPage = lazy(() => import("./pages/MenuView"));
const FavoritesPage = lazy(() => import("./pages/Favorites"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const CocktailDetailPage = lazy(() => import("./pages/CocktailDetail"));
const PreparationModePage = lazy(() => import("./pages/PreparationMode"));
const IngredientPickerPage = lazy(() => import("./pages/IngredientPicker"));
const RecipeFormPage = lazy(() => import("./pages/RecipeForm"));
const SharePage = lazy(() => import("./pages/Share"));
const SharedRecipePage = lazy(() => import("./pages/SharedRecipe"));

// Coquille commune à (quasiment) toutes les routes : sidebar desktop (≥ lg,
// SideNav) + zone de contenu qui s'étend pour remplir l'écran, TabBar en
// bas sur mobile/tablette. Chaque page choisit elle-même sa propre largeur
// de contenu (colonne de lecture étroite pour les fiches/formulaires,
// largeur large pour les écrans de navigation) — voir le commentaire dans
// index.css. Seul le mode Préparation (immersif, sans navigation) reste en
// dehors de cette coquille.
function AppShell() {
  return (
    <div className="flex flex-1 min-h-0 w-full lg:max-w-[1400px] lg:mx-auto">
      <SideNav />
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <main id="main-content" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  );
}

function PageLoader() {
  return <div style={{ minHeight: "100svh", background: "var(--color-bg)" }} />;
}

// Lien d'évitement : invisible tant qu'il n'a pas le focus clavier, permet
// de sauter directement au contenu sans traverser la TabBar à chaque page.
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
    >
      Aller au contenu
    </a>
  );
}

// Un lien externe (carte QR-codée, recette partagée, cocktail partagé) doit
// s'afficher immédiatement pour qui le reçoit — même sans jamais avoir
// ouvert l'app. Le forcer à choisir une langue puis traverser l'onboarding
// avant de voir le contenu qu'on lui a envoyé casse complètement l'usage
// "aucun compte requis" de ces liens. useTranslation() retombe déjà sur le
// français quand la langue n'est pas choisie, donc rien ne casse à l'omettre.
function isPublicShareRoute(pathname: string): boolean {
  return /^\/(menu|shared|cocktail)(\/|$)/.test(pathname);
}

export default function App() {
  const preference = useThemeStore((s) => s.preference);
  const skinId = useCosmeticsStore((s) => s.skinId);
  const location = useLocation();
  const skipOnboarding = isPublicShareRoute(location.pathname);

  useEffect(() => {
    applyThemeToDocument(preference);
  }, [preference]);

  useEffect(() => {
    applySkinToDocument(skinId);
  }, [skinId]);

  return (
    <>
      <SkipLink />
      {!skipOnboarding && <LanguagePicker />}
      {!skipOnboarding && <OnboardingFlow />}
      <AchievementToast />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/collection/:id" element={<CollectionDetailPage />} />
            <Route path="/mybar" element={<MyBarPage />} />
            <Route path="/party" element={<PartyPlannerPage />} />
            <Route path="/costing" element={<CostingPage />} />
            <Route path="/menu-builder" element={<MenuBuilderPage />} />
            <Route path="/menu/:code" element={<MenuViewPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/cocktail/:id" element={<CocktailDetailPage />} />
            <Route path="/cocktail/:id/share" element={<SharePage />} />
            <Route path="/picker" element={<IngredientPickerPage />} />
            <Route path="/recipe/new" element={<RecipeFormPage />} />
            <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
            <Route path="/shared/:code" element={<SharedRecipePage />} />
          </Route>

          {/* Seule route hors AppShell : le mode Préparation est un plein
              écran immersif volontairement sans sidebar ni TabBar (voir
              PreparationMode.tsx). display:contents sur ce <main> : landmark
              d'accessibilité sans participer à la mise en page. */}
          <Route path="/cocktail/:id/prepare" element={<main id="main-content" className="contents"><PreparationModePage /></main>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
