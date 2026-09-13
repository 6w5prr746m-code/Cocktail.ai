import { useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailCard } from "../components/CocktailCard";
import { useAllCocktails, useCollection } from "../domain/catalog";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const collection = useCollection(id);
  const allCocktails = useAllCocktails();

  if (!collection) {
    return (
      <div>
        <ScreenHeader title="Collection introuvable" />
      </div>
    );
  }

  const cocktails = collection.cocktailIds
    .map((cid) => allCocktails.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="pb-8">
      <ScreenHeader title={collection.name} />
      <div className="grid grid-cols-2 gap-4 px-4 pt-4">
        {cocktails.map((c) => (
          <CocktailCard key={c.id} cocktail={c} />
        ))}
      </div>
    </div>
  );
}
