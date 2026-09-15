import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TabBar } from "./components/TabBar";
import { applyThemeToDocument, useThemeStore } from "./state/theme";

// Home reste chargée eagerly (page d'entrée quasi systématique) — le reste
// est découpé par route : chaque écran devient son propre chunk JS, chargé
// à la demande plutôt que tout d'un bloc au premier chargement.
import HomePage from "./pages/Home";
const LibraryPage = lazy(() => import("./pages/Library"));
const CollectionDetailPage = lazy(() => import("./pages/CollectionDetail"));
const MyBarPage = lazy(() => import("./pages/MyBar"));
const FavoritesPage = lazy(() => import("./pages/Favorites"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const CocktailDetailPage = lazy(() => import("./pages/CocktailDetail"));
const PreparationModePage = lazy(() => import("./pages/PreparationMode"));
const IngredientPickerPage = lazy(() => import("./pages/IngredientPicker"));
const RecipeFormPage = lazy(() => import("./pages/RecipeForm"));
const SharePage = lazy(() => import("./pages/Share"));

function TabLayout() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <main id="main-content" className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <TabBar />
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

export default function App() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyThemeToDocument(preference);
  }, [preference]);

  return (
    <>
      <SkipLink />
      <OnboardingFlow />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<TabLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/collection/:id" element={<CollectionDetailPage />} />
            <Route path="/mybar" element={<MyBarPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* display:contents sur ces <main> : landmark d'accessibilité sans
              participer à la mise en page (chaque écran gère déjà lui-même
              sa propre hauteur/flex en enfant direct de #root). */}
          <Route path="/cocktail/:id" element={<main id="main-content" className="contents"><CocktailDetailPage /></main>} />
          <Route path="/cocktail/:id/prepare" element={<main id="main-content" className="contents"><PreparationModePage /></main>} />
          <Route path="/cocktail/:id/share" element={<main id="main-content" className="contents"><SharePage /></main>} />
          <Route path="/picker" element={<main id="main-content" className="contents"><IngredientPickerPage /></main>} />
          <Route path="/recipe/new" element={<main id="main-content" className="contents"><RecipeFormPage /></main>} />
          <Route path="/recipe/:id/edit" element={<main id="main-content" className="contents"><RecipeFormPage /></main>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
