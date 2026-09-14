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
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

function PageLoader() {
  return <div style={{ minHeight: "100svh", background: "var(--color-bg)" }} />;
}

export default function App() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyThemeToDocument(preference);
  }, [preference]);

  return (
    <>
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

          <Route path="/cocktail/:id" element={<CocktailDetailPage />} />
          <Route path="/cocktail/:id/prepare" element={<PreparationModePage />} />
          <Route path="/cocktail/:id/share" element={<SharePage />} />
          <Route path="/picker" element={<IngredientPickerPage />} />
          <Route path="/recipe/new" element={<RecipeFormPage />} />
          <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
