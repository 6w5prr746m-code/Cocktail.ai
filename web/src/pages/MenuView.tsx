import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllCocktails } from "../domain/catalog";
import { decodeMenu } from "../domain/menuShareCode";
import { formatCurrency } from "../domain/formatting";
import { useTranslation } from "../domain/i18n/useTranslation";

export default function MenuViewPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const cocktails = useAllCocktails();

  const payload = useMemo(() => (code ? decodeMenu(code) : null), [code]);

  const rows = useMemo(() => {
    if (!payload) return [];
    return payload.items
      .map((item) => ({ item, cocktail: cocktails.find((c) => c.id === item.cocktailId) }))
      .filter((row): row is { item: (typeof payload.items)[number]; cocktail: NonNullable<(typeof row)["cocktail"]> } =>
        Boolean(row.cocktail),
      );
  }, [payload, cocktails]);

  if (!payload) {
    return (
      <div className="max-w-[640px] mx-auto">
        <ScreenHeader title={t("menuView.title")} />
        <p className="px-4 pt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("menuView.invalidLink")}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      <ScreenHeader
        title={payload.barName}
        action={
          <button
            type="button"
            onClick={() => window.print()}
            aria-label={t("menuView.printAria")}
            title={t("menuView.printAria")}
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "var(--color-surface)" }}
          >
            🖨️
          </button>
        }
      />
      <p className="px-4 pt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {t("menuView.subtitle")}
      </p>
      <div className="px-4 pt-4 flex flex-col gap-2">
        {rows.map(({ item, cocktail }) => (
          <Link
            key={item.cocktailId}
            to={`/cocktail/${cocktail.id}`}
            className="flex items-center justify-between rounded-xl px-4 py-3.5"
            style={{ background: "var(--color-surface)" }}
          >
            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
              {cocktail.name}
            </span>
            {item.price !== null && (
              <span className="font-semibold flex-shrink-0" style={{ color: "var(--color-accent-gold-text)" }}>
                {formatCurrency(item.price)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
