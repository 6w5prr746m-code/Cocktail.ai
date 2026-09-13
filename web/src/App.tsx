import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { applyThemeToDocument, useThemeStore } from "./state/theme";

import HomePage from "./pages/Home";
import LibraryPage from "./pages/Library";
import CollectionDetailPage from "./pages/CollectionDetail";
import MyBarPage from "./pages/MyBar";
import FavoritesPage from "./pages/Favorites";
import ProfilePage from "./pages/Profile";
import CocktailDetailPage from "./pages/CocktailDetail";
import PreparationModePage from "./pages/PreparationMode";
import IngredientPickerPage from "./pages/IngredientPicker";
import RecipeFormPage from "./pages/RecipeForm";
import SharePage from "./pages/Share";

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

export default function App() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyThemeToDocument(preference);
  }, [preference]);

  return (
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
  );
}
