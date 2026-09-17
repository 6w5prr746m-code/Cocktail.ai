import { useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Star, Link2 } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAllCocktails } from "../domain/catalog";
import { fuzzyIncludes } from "../domain/fuzzySearch";
import { encodeMenu, MENU_PRINT_FORMATS, type MenuItem, type MenuLayout, type MenuPayload, type MenuPrintFormat } from "../domain/menuShareCode";
import { MENU_THEMES, MENU_THEME_IDS, type MenuTheme } from "../domain/menuThemes";
import { compressImageFile } from "../domain/imageCompression";
import { buildAppUrl } from "../domain/appUrl";
import { useTranslation } from "../domain/i18n/useTranslation";
import type { TranslationKey } from "../domain/i18n/useTranslation";

const DEFAULT_ITEMS_PER_PAGE = 4;
const LOGO_MAX_DIMENSION = 100;
const LOGO_QUALITY = 0.55;
const STORY_IMAGE_MAX_DIMENSION = 220;
const STORY_IMAGE_QUALITY = 0.5;
// Mesuré empiriquement (voir historique) : un QR code cesse de s'encoder
// au-delà d'environ 2280 caractères de code base64url réaliste pour l'URL
// complète. On se garde une marge en dessous pour rester scannable de
// façon fiable (pas juste "techniquement encodable").
const QR_SAFE_CODE_LENGTH = 2000;

const LAYOUT_OPTIONS: { value: MenuLayout; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: "list", labelKey: "menuBuilder.layoutList", descKey: "menuBuilder.layoutListDesc" },
  { value: "grid2", labelKey: "menuBuilder.layoutGrid2", descKey: "menuBuilder.layoutGrid2Desc" },
  { value: "grid3", labelKey: "menuBuilder.layoutGrid3", descKey: "menuBuilder.layoutGrid3Desc" },
  { value: "pages", labelKey: "menuBuilder.layoutPages", descKey: "menuBuilder.layoutPagesDesc" },
  { value: "featured", labelKey: "menuBuilder.layoutFeatured", descKey: "menuBuilder.layoutFeaturedDesc" },
];

const THEME_LABEL_KEYS: Record<MenuTheme, TranslationKey> = {
  classic: "menuBuilder.themeClassic",
  instagram: "menuBuilder.themeInstagram",
  apple: "menuBuilder.themeApple",
};

const PRINT_FORMAT_LABEL_KEYS: Record<MenuPrintFormat, { labelKey: TranslationKey; descKey: TranslationKey }> = {
  a5: { labelKey: "menuBuilder.printFormatA5", descKey: "menuBuilder.printFormatA5Desc" },
  a4: { labelKey: "menuBuilder.printFormatA4", descKey: "menuBuilder.printFormatA4Desc" },
};

export default function MenuBuilderPage() {
  const { t } = useTranslation();
  // Une carte publique ne peut référencer que des cocktails du catalogue
  // (bundlé dans l'app, donc résoluble sur n'importe quel appareil qui
  // scanne le QR code) — jamais une recette perso, qui ne vit que dans le
  // localStorage de son créateur (voir menuShareCode.ts).
  const cocktails = useAllCocktails();
  const catalogCocktails = useMemo(() => cocktails.filter((c) => !c.isUserCreated), [cocktails]);

  const [barName, setBarName] = useState("");
  const [theme, setTheme] = useState<MenuTheme>("classic");
  const [printFormat, setPrintFormat] = useState<MenuPrintFormat>("a5");
  const [logo, setLogo] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [layout, setLayout] = useState<MenuLayout>("list");
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const storyTextFileInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);

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

  function toggleFeatured(id: string) {
    setItems((prev) => prev.map((i) => (i.cocktailId === id ? { ...i, featured: !i.featured } : i)));
    invalidateGenerated();
  }

  function changeLayout(next: MenuLayout) {
    setLayout(next);
    invalidateGenerated();
  }

  function changeTheme(next: MenuTheme) {
    setTheme(next);
    invalidateGenerated();
  }

  function changePrintFormat(next: MenuPrintFormat) {
    setPrintFormat(next);
    invalidateGenerated();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setLogo(await compressImageFile(file, LOGO_MAX_DIMENSION, LOGO_QUALITY));
    } catch {
      // fichier illisible (format non supporté, etc.) — on ignore plutôt que de casser le formulaire
    }
    invalidateGenerated();
  }

  function removeLogo() {
    setLogo(null);
    invalidateGenerated();
  }

  async function handleStoryTextFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setStoryText((await file.text()).slice(0, 2000));
    } catch {
      // fichier illisible — on ignore
    }
    invalidateGenerated();
  }

  async function handleStoryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setStoryImage(await compressImageFile(file, STORY_IMAGE_MAX_DIMENSION, STORY_IMAGE_QUALITY));
    } catch {
      // fichier illisible — on ignore
    }
    invalidateGenerated();
  }

  function removeStoryImage() {
    setStoryImage(null);
    invalidateGenerated();
  }

  const currentPayload = useMemo<MenuPayload>(
    () => ({
      barName: barName.trim() || "…",
      layout,
      itemsPerPage: layout === "pages" ? itemsPerPage : undefined,
      theme,
      logo: logo ?? undefined,
      story: storyText.trim() || storyImage ? { text: storyText.trim() || undefined, image: storyImage ?? undefined } : undefined,
      printFormat,
      items,
    }),
    [barName, layout, itemsPerPage, theme, logo, storyText, storyImage, printFormat, items],
  );

  const codeLength = useMemo(() => (items.length > 0 ? encodeMenu(currentPayload).length : 0), [currentPayload, items.length]);
  const qrLikelyToWork = codeLength <= QR_SAFE_CODE_LENGTH;

  async function generate() {
    if (!barName.trim() || items.length === 0) return;
    const code = encodeMenu({ ...currentPayload, barName: barName.trim() });
    const url = buildAppUrl(`/menu/${code}`);
    setMenuUrl(url);
    if (code.length <= QR_SAFE_CODE_LENGTH) {
      try {
        setQrDataUrl(await QRCode.toDataURL(url, { margin: 1, width: 240 }));
      } catch {
        setQrDataUrl(null);
      }
    } else {
      setQrDataUrl(null);
    }
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
            {t("menuBuilder.themeTitle")}
          </h2>
          <div className="flex gap-2">
            {MENU_THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => changeTheme(id)}
                aria-pressed={theme === id}
                className="flex-1 rounded-xl overflow-hidden"
                style={{ border: theme === id ? "2px solid var(--color-accent-gold)" : "2px solid transparent" }}
              >
                <div style={{ height: 36, background: MENU_THEMES[id].coverBackground }} />
                <p
                  className="text-xs font-medium py-1.5"
                  style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                >
                  {t(THEME_LABEL_KEYS[id])}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.logoTitle")}
          </h2>
          <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
            {t("menuBuilder.logoHint")}
          </p>
          <div className="flex items-center gap-3">
            {logo && (
              <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 56, height: 56, background: "#ffffff" }}>
                <img src={logo} alt={t("menuBuilder.logoAlt")} className="w-full h-full object-contain" />
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
            >
              {logo ? t("menuBuilder.logoChangeButton") : t("menuBuilder.logoUploadButton")}
            </button>
            {logo && (
              <button
                type="button"
                onClick={removeLogo}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
                style={{ color: "var(--color-danger-text)" }}
              >
                {t("menuBuilder.logoRemoveButton")}
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.storyTitle")}
          </h2>
          {!logo ? (
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {t("menuBuilder.storyLockedHint")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={storyText}
                onChange={(e) => {
                  setStoryText(e.target.value);
                  invalidateGenerated();
                }}
                placeholder={t("menuBuilder.storyTextPlaceholder")}
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input ref={storyTextFileInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleStoryTextFileUpload} />
                <button
                  type="button"
                  onClick={() => storyTextFileInputRef.current?.click()}
                  className="rounded-xl px-3.5 py-2.5 text-xs font-medium"
                  style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                >
                  {t("menuBuilder.storyTextFileButton")}
                </button>
                <input ref={storyImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleStoryImageUpload} />
                <button
                  type="button"
                  onClick={() => storyImageInputRef.current?.click()}
                  className="rounded-xl px-3.5 py-2.5 text-xs font-medium"
                  style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                >
                  {t("menuBuilder.storyImageUploadButton")}
                </button>
                {storyImage && (
                  <>
                    <div className="rounded-lg overflow-hidden" style={{ width: 36, height: 36 }}>
                      <img src={storyImage} alt={t("menuBuilder.storyImageAlt")} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={removeStoryImage}
                      className="rounded-xl px-3.5 py-2.5 text-xs font-medium"
                      style={{ color: "var(--color-danger-text)" }}
                    >
                      {t("menuBuilder.storyImageRemoveButton")}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.layoutTitle")}
          </h2>
          <div className="flex flex-col gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => changeLayout(opt.value)}
                aria-pressed={layout === opt.value}
                className="text-left rounded-xl px-3.5 py-2.5"
                style={{
                  background: layout === opt.value ? "var(--color-accent-gold)" : "var(--color-surface)",
                  color: layout === opt.value ? "#0b0b0f" : "var(--color-text-primary)",
                }}
              >
                <p className="text-sm font-semibold">{t(opt.labelKey)}</p>
                <p className="text-xs" style={{ color: layout === opt.value ? "rgba(11,11,15,0.7)" : "var(--color-text-secondary)" }}>
                  {t(opt.descKey)}
                </p>
              </button>
            ))}
          </div>
          {layout === "pages" && (
            <div className="flex items-center gap-4 mt-3 rounded-xl px-3.5 py-2.5" style={{ background: "var(--color-surface)" }}>
              <span className="text-sm flex-1" style={{ color: "var(--color-text-primary)" }}>
                {t("menuBuilder.itemsPerPageLabel")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setItemsPerPage((n) => Math.max(1, n - 1));
                  invalidateGenerated();
                }}
                aria-label={t("menuBuilder.decreaseItemsPerPageAria")}
                className="rounded-full flex items-center justify-center text-base font-semibold"
                style={{ width: 32, height: 32, background: "var(--color-bg)", color: "var(--color-text-primary)" }}
              >
                −
              </button>
              <span className="text-base font-bold w-6 text-center" style={{ color: "var(--color-text-primary)" }}>
                {itemsPerPage}
              </span>
              <button
                type="button"
                onClick={() => {
                  setItemsPerPage((n) => Math.min(12, n + 1));
                  invalidateGenerated();
                }}
                aria-label={t("menuBuilder.increaseItemsPerPageAria")}
                className="rounded-full flex items-center justify-center text-base font-semibold"
                style={{ width: 32, height: 32, background: "var(--color-bg)", color: "var(--color-text-primary)" }}
              >
                +
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {t("menuBuilder.printFormatTitle")}
          </h2>
          <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
            {t("menuBuilder.printFormatHint")}
          </p>
          <div className="flex gap-2">
            {MENU_PRINT_FORMATS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => changePrintFormat(id)}
                aria-pressed={printFormat === id}
                className="flex-1 text-left rounded-xl px-3.5 py-2.5"
                style={{
                  background: printFormat === id ? "var(--color-accent-gold)" : "var(--color-surface)",
                  color: printFormat === id ? "#0b0b0f" : "var(--color-text-primary)",
                }}
              >
                <p className="text-sm font-semibold">{t(PRINT_FORMAT_LABEL_KEYS[id].labelKey)}</p>
                <p className="text-xs" style={{ color: printFormat === id ? "rgba(11,11,15,0.7)" : "var(--color-text-secondary)" }}>
                  {t(PRINT_FORMAT_LABEL_KEYS[id].descKey)}
                </p>
              </button>
            ))}
          </div>
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
                    {item && <Check size={15} strokeWidth={2.5} aria-hidden />}
                    {c.name}
                  </button>
                  {item && layout === "featured" && (
                    <button
                      type="button"
                      onClick={() => toggleFeatured(c.id)}
                      aria-pressed={Boolean(item.featured)}
                      aria-label={t("menuBuilder.featuredAria", { name: c.name })}
                      title={t("menuBuilder.featuredAria", { name: c.name })}
                      className="flex-shrink-0 rounded-full flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        background: item.featured ? "var(--color-accent-gold)" : "var(--color-surface)",
                        color: item.featured ? "#0b0b0f" : "var(--color-text-primary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <Star size={15} strokeWidth={1.75} fill={item.featured ? "currentColor" : "none"} aria-hidden />
                    </button>
                  )}
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

        {items.length > 0 && (
          <p className="text-xs text-center" style={{ color: qrLikelyToWork ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
            {t(qrLikelyToWork ? "menuBuilder.sizeIndicatorOk" : "menuBuilder.sizeIndicatorTooLarge", { count: codeLength })}
          </p>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={!barName.trim() || items.length === 0}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f", opacity: !barName.trim() || items.length === 0 ? 0.5 : 1 }}
        >
          {t("menuBuilder.generateButton")}
        </button>

        {menuUrl && (
          <div className="rounded-2xl p-4 glass-card flex flex-col items-center gap-3">
            {qrDataUrl && <img src={qrDataUrl} alt={t("menuBuilder.qrAlt")} width={200} height={200} />}
            <p className="text-xs break-all text-center" style={{ color: "var(--color-text-secondary)" }}>
              {menuUrl}
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={copyLink}
                className="flex-1 rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-1.5"
                style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
              >
                {linkCopied ? <Check size={15} strokeWidth={2.25} aria-hidden /> : <Link2 size={15} strokeWidth={2} aria-hidden />}
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
