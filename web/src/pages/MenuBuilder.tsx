import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllCocktails } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { encodeMenu, type MenuItem } from "../domain/menuShareCode";
import { buildAppUrl } from "../domain/appUrl";
import { useTranslation } from "../domain/i18n/useTranslation";

export default function MenuBuilderPage() {
  const { t } = useTranslation();
  // Une carte publique ne peut référencer que des cocktails du catalogue
  // (bundlé dans l'app, donc résoluble sur n'importe quel appareil qui
  // scanne le QR code) — jamais une recette perso, qui ne vit que dans le
  // localStorage de son créateur (voir menuShareCode.ts).
  const cocktails = useAllCocktails();
  const catalogCocktails = useMemo(() => cocktails.filter((c) => !c.isUserCreated), [cocktails]);

  const [barName, setBarName] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Les cocktails déjà sélectionnés restent affichés (et en tête de liste)
  // même quand la recherche filtre sur autre chose — sinon changer de
  // recherche fait disparaître leur champ de prix, ce qui casse la revue
  // d'une carte en cours de construction.
  const filtered = useMemo(() => {
    const q = query.trim();
    const selectedIds = new Set(items.map((i) => i.cocktailId));
    return catalogCocktails
      .filter((c) => selectedIds.has(c.id) || !q || fuzzyIncludes(q, c.name))
      .sort((a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)))
      .slice(0, 40);
  }, [catalogCocktails, query, items]);

  function invalidateGenerated() {
    setMenuUrl(null);
    setQrDataUrl(null);
  }

  function toggle(id: string) {
    setItems((prev) => (prev.some((i) => i.cocktailId === id) ? prev.filter((i) => i.cocktailId !== id) : [...prev, { cocktailId: id, price: null }]));
    invalidateGenerated();
  }

  function setItemPrice(id: string, value: string) {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : Number(trimmed.replace(",", "."));
    setItems((prev) => prev.map((i) => (i.cocktailId === id ? { ...i, price: num === null || Number.isNaN(num) ? null : num } : i)));
    invalidateGenerated();
  }

  async function generate() {
    if (!barName.trim() || items.length === 0) return;
    const code = encodeMenu({ barName: barName.trim(), items });
    const url = buildAppUrl(`/menu/${code}`);
    setMenuUrl(url);
    setQrDataUrl(await QRCode.toDataURL(url, { margin: 1, width: 240 }));
  }

  async function copyLink() {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard indisponible — pas de fallback nécessaire ici
    }
  }

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      <ScreenHeader title={t("menuBuilder.title")} />
      <div className="px-4 pt-3 flex flex-col gap-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("menuBuilder.intro")}
        </p>

        <div>
          <label className="text-base font-semibold mb-2 block" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.barNameLabel")}
          </label>
          <input
            value={barName}
            onChange={(e) => {
              setBarName(e.target.value);
              invalidateGenerated();
            }}
            placeholder={t("menuBuilder.barNamePlaceholder")}
            aria-label={t("menuBuilder.barNameLabel")}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
          />
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.selectCocktailsTitle", { count: items.length })}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("partyPlanner.searchPlaceholder")}
            aria-label={t("menuBuilder.searchAria")}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
          />
          <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {filtered.map((c) => {
              const item = items.find((i) => i.cocktailId === c.id);
              return (
                <li key={c.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={Boolean(item)}
                    className="flex-1 min-w-0 text-left rounded-xl px-3.5 py-2.5 text-sm font-medium flex items-center gap-2"
                    style={{
                      background: item ? "var(--color-accent-gold)" : "var(--color-surface)",
                      color: item ? "#0b0b0f" : "var(--color-text-primary)",
                    }}
                  >
                    <span aria-hidden>{item ? "✓" : ""}</span>
                    {c.name}
                  </button>
                  {item && (
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      defaultValue={item.price ?? ""}
                      onBlur={(e) => setItemPrice(c.id, e.target.value)}
                      placeholder={t("menuBuilder.pricePlaceholder")}
                      aria-label={t("menuBuilder.priceAria", { name: c.name })}
                      className="flex-shrink-0 w-20 text-xs rounded-lg px-2 py-2 outline-none"
                      style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!barName.trim() || items.length === 0}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f", opacity: !barName.trim() || items.length === 0 ? 0.5 : 1 }}
        >
          {t("menuBuilder.generateButton")}
        </button>

        {menuUrl && qrDataUrl && (
          <div className="rounded-2xl p-4 glass-card flex flex-col items-center gap-3">
            <img src={qrDataUrl} alt={t("menuBuilder.qrAlt")} width={200} height={200} />
            <p className="text-xs break-all text-center" style={{ color: "var(--color-text-secondary)" }}>
              {menuUrl}
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={copyLink}
                className="flex-1 rounded-2xl py-3 text-sm font-medium"
                style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
              >
                {linkCopied ? t("menuBuilder.linkCopied") : t("menuBuilder.copyLink")}
              </button>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center rounded-2xl py-3 text-sm font-medium"
                style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
              >
                {t("menuBuilder.previewLink")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
