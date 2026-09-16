import { useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailCard } from "../components/CocktailCard";
import { useAllCocktails, useCollection } from "../domain/catalog";
import { useTranslation } from "../domain/i18n/useTranslation";
import { getNotableCreator } from "../domain/notableCreators";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const collection = useCollection(id);
  const allCocktails = useAllCocktails();
  const { t, locale } = useTranslation();

  if (!collection) {
    return (
      <div className="max-w-[560px] md:max-w-[720px] lg:max-w-[1100px] xl:max-w-[1300px] mx-auto">
        <ScreenHeader title={t("collectionDetail.notFound")} />
      </div>
    );
  }

  const cocktails = collection.cocktailIds
    .map((cid) => allCocktails.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="pb-8 max-w-[560px] md:max-w-[720px] lg:max-w-[1100px] xl:max-w-[1300px] mx-auto">
      <ScreenHeader title={collection.name} />
      {collection.description && (
        <p className="px-4 pt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {collection.description}
        </p>
      )}
      {collection.sponsor && (
        <p className="px-4 pt-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-accent-gold-text)" }}>
          {t("collectionDetail.presentedBy", { name: collection.sponsor })}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 pt-4">
        {cocktails.map((c) => {
          const notable = getNotableCreator(c.id, locale);
          return (
            <CocktailCard
              key={c.id}
              cocktail={c}
              caption={notable ? t("notableCreator.cardCaption", { name: notable.creator, year: notable.year }) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
