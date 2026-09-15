// Pipeline d'import en masse depuis TheCocktailDB (thecocktaildb.com/api.php,
// clé de test gratuite "1") — conditions d'utilisation : contenu copiable/
// modifiable via les endpoints officiels, usage libre pour une app web tant
// qu'elle n'est pas publiée sur un app store (voir web/README.md § Sprint 10
// pour le détail). Récupère l'intégralité du catalogue accessible sans
// abonnement (recherche exhaustive par première lettre a-z + 0-9), le
// transforme vers le schéma interne (src/domain/types.ts) via des
// heuristiques documentées ci-dessous, dédoublonne avec les 14 cocktails
// déjà curatés à la main, et fusionne le résultat dans src/data/cocktails.json.
//
// Usage : npm run import:cocktaildb
//
// Limites assumées (voir web/README.md) : pas de champ "pays d'origine" côté
// source (contrairement à TheMealDB) → origin générique "International" ;
// pas d'histoire/conseils écrits (history/tips = null) ; difficulté, temps de
// préparation, type de glace et garniture déduits par heuristique plutôt que
// données ; traduction des noms d'ingrédients couvrant les ~200 ingrédients
// les plus fréquents (repli sur le nom anglais sinon, documenté).

import { writeFile, readFile } from "node:fs/promises";

const COCKTAILS_PATH = new URL("../src/data/cocktails.json", import.meta.url);
const LETTERS = [..."abcdefghijklmnopqrstuvwxyz0123456789"];

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ---------------------------------------------------------------------
// Dictionnaire de traduction des ingrédients — couvre les ingrédients les
// plus fréquents du catalogue TheCocktailDB (± 200 entrées ~= 90% des
// occurrences totales). Clé = nom anglais normalisé (minuscule, espaces
// multiples réduits) ; valeur = { name, category }.
// ---------------------------------------------------------------------
const ING = {
  // Alcools blancs / rhums
  "light rum": ["Rhum blanc", "Alcool"],
  "white rum": ["Rhum blanc", "Alcool"],
  "gold rum": ["Rhum ambré", "Alcool"],
  "dark rum": ["Rhum brun", "Alcool"],
  rum: ["Rhum", "Alcool"],
  "151 proof rum": ["Rhum overproof", "Alcool"],
  "spiced rum": ["Rhum épicé", "Alcool"],
  "malibu rum": ["Rhum Malibu", "Alcool"],
  "añejo rum": ["Rhum ambré", "Alcool"],
  "blackstrap rum": ["Rhum brun", "Alcool"],
  cachaca: ["Cachaça", "Alcool"],
  // Vodka / gin
  vodka: ["Vodka", "Alcool"],
  "absolut vodka": ["Vodka", "Alcool"],
  "absolut citron": ["Vodka citron", "Alcool"],
  "absolut kurant": ["Vodka cassis", "Alcool"],
  "absolut peppar": ["Vodka poivrée", "Alcool"],
  "peach vodka": ["Vodka pêche", "Alcool"],
  "vanilla vodka": ["Vodka vanille", "Alcool"],
  "cranberry vodka": ["Vodka cranberry", "Alcool"],
  "raspberry vodka": ["Vodka framboise", "Alcool"],
  "lime vodka": ["Vodka citron vert", "Alcool"],
  gin: ["Gin", "Alcool"],
  "sloe gin": ["Sloe gin", "Alcool"],
  // Whisky / bourbon / scotch
  whiskey: ["Whisky", "Alcool"],
  whisky: ["Whisky", "Alcool"],
  scotch: ["Scotch", "Alcool"],
  "blended scotch": ["Scotch", "Alcool"],
  "blended whiskey": ["Whisky", "Alcool"],
  bourbon: ["Bourbon", "Alcool"],
  "irish whiskey": ["Whisky irlandais", "Alcool"],
  "rye whiskey": ["Rye whiskey", "Alcool"],
  "tennessee whiskey": ["Tennessee whiskey", "Alcool"],
  "jack daniels": ["Jack Daniel's", "Alcool"],
  "jim beam": ["Jim Beam", "Alcool"],
  "wild turkey": ["Wild Turkey", "Alcool"],
  "crown royal": ["Crown Royal", "Alcool"],
  "johnnie walker": ["Johnnie Walker", "Alcool"],
  "islay single malt scotch": ["Scotch tourbé", "Alcool"],
  "yukon jack": ["Yukon Jack", "Alcool"],
  // Tequila / mezcal
  tequila: ["Tequila", "Alcool"],
  mezcal: ["Mezcal", "Alcool"],
  // Autres alcools forts
  brandy: ["Brandy", "Alcool"],
  cognac: ["Cognac", "Alcool"],
  "cherry brandy": ["Brandy de cerise", "Alcool"],
  "apricot brandy": ["Brandy d'abricot", "Alcool"],
  "blackberry brandy": ["Brandy de mûre", "Alcool"],
  "apple brandy": ["Brandy de pomme", "Alcool"],
  "peach brandy": ["Brandy de pêche", "Alcool"],
  "coffee brandy": ["Brandy au café", "Alcool"],
  applejack: ["Applejack", "Alcool"],
  cognac_: ["Cognac", "Alcool"],
  pisco: ["Pisco", "Alcool"],
  absinthe: ["Absinthe", "Alcool"],
  everclear: ["Alcool neutre", "Alcool"],
  "grain alcohol": ["Alcool neutre", "Alcool"],
  firewater: ["Alcool épicé", "Alcool"],
  "goldschlager": ["Goldschläger", "Alcool"],
  "hot damn": ["Schnaps à la cannelle", "Alcool"],
  "southern comfort": ["Southern Comfort", "Alcool"],
  ouzo: ["Ouzo", "Alcool"],
  anis: ["Anisette", "Alcool"],
  anisette: ["Anisette", "Alcool"],
  ricard: ["Pastis", "Alcool"],
  // Vermouths / vins fortifiés / apéritifs
  "dry vermouth": ["Vermouth sec", "Alcool"],
  "sweet vermouth": ["Vermouth rouge", "Alcool"],
  "rosso vermouth": ["Vermouth rouge", "Alcool"],
  vermouth: ["Vermouth", "Alcool"],
  campari: ["Campari", "Alcool"],
  aperol: ["Aperol", "Alcool"],
  sherry: ["Xérès", "Alcool"],
  port: ["Porto", "Alcool"],
  "ruby port": ["Porto ruby", "Alcool"],
  "lillet blanc": ["Lillet blanc", "Alcool"],
  lillet: ["Lillet", "Alcool"],
  "dubonnet rouge": ["Dubonnet rouge", "Alcool"],
  // Vins / bulles / bières
  "red wine": ["Vin rouge", "Alcool"],
  "white wine": ["Vin blanc", "Alcool"],
  wine: ["Vin", "Alcool"],
  champagne: ["Champagne", "Alcool"],
  prosecco: ["Prosecco", "Effervescent"],
  beer: ["Bière", "Alcool"],
  lager: ["Bière blonde", "Alcool"],
  corona: ["Bière blonde", "Alcool"],
  "guinness stout": ["Stout", "Alcool"],
  cider: ["Cidre", "Alcool"],
  // Liqueurs
  "triple sec": ["Triple sec", "Liqueur"],
  cointreau: ["Cointreau", "Liqueur"],
  "grand marnier": ["Grand Marnier", "Liqueur"],
  "blue curacao": ["Curaçao bleu", "Liqueur"],
  "orange curacao": ["Curaçao orange", "Liqueur"],
  amaretto: ["Amaretto", "Liqueur"],
  kahlua: ["Kahlúa", "Liqueur"],
  "coffee liqueur": ["Liqueur de café", "Liqueur"],
  "tia maria": ["Tia Maria", "Liqueur"],
  "baileys irish cream": ["Baileys", "Liqueur"],
  "irish cream": ["Crème irlandaise", "Liqueur"],
  sambuca: ["Sambuca", "Liqueur"],
  "black sambuca": ["Sambuca noire", "Liqueur"],
  galliano: ["Galliano", "Liqueur"],
  "maraschino liqueur": ["Liqueur de marasquin", "Liqueur"],
  "creme de cacao": ["Crème de cacao", "Liqueur"],
  "dark creme de cacao": ["Crème de cacao brune", "Liqueur"],
  "chocolate liqueur": ["Liqueur de chocolat", "Liqueur"],
  "creme de cassis": ["Crème de cassis", "Liqueur"],
  "creme de mure": ["Crème de mûre", "Liqueur"],
  "chambord raspberry liqueur": ["Liqueur de framboise", "Liqueur"],
  "raspberry liqueur": ["Liqueur de framboise", "Liqueur"],
  "banana liqueur": ["Liqueur de banane", "Liqueur"],
  "creme de banane": ["Crème de banane", "Liqueur"],
  "midori melon liqueur": ["Liqueur de melon", "Liqueur"],
  "melon liqueur": ["Liqueur de melon", "Liqueur"],
  "peach schnapps": ["Schnaps à la pêche", "Liqueur"],
  "peachtree schnapps": ["Schnaps à la pêche", "Liqueur"],
  "strawberry schnapps": ["Schnaps à la fraise", "Liqueur"],
  "butterscotch schnapps": ["Schnaps butterscotch", "Liqueur"],
  "blueberry schnapps": ["Schnaps myrtille", "Liqueur"],
  "green chartreuse": ["Chartreuse verte", "Liqueur"],
  "yellow chartreuse": ["Chartreuse jaune", "Liqueur"],
  benedictine: ["Bénédictine", "Liqueur"],
  drambuie: ["Drambuie", "Liqueur"],
  frangelico: ["Frangelico", "Liqueur"],
  "st. germain": ["St-Germain", "Liqueur"],
  "elderflower cordial": ["Sirop de sureau", "Sirop"],
  jägermeister: ["Jägermeister", "Liqueur"],
  jagermeister: ["Jägermeister", "Liqueur"],
  passoa: ["Passoã", "Liqueur"],
  "cherry heering": ["Liqueur de cerise", "Liqueur"],
  "cherry liqueur": ["Liqueur de cerise", "Liqueur"],
  "strawberry liqueur": ["Liqueur de fraise", "Liqueur"],
  "kiwi liqueur": ["Liqueur de kiwi", "Liqueur"],
  "coconut liqueur": ["Liqueur de coco", "Liqueur"],
  "coconut_liqueur": ["Liqueur de coco", "Liqueur"],
  advocaat: ["Advocaat", "Liqueur"],
  "godiva liqueur": ["Liqueur de chocolat", "Liqueur"],
  "white creme de menthe": ["Crème de menthe blanche", "Liqueur"],
  "green creme de menthe": ["Crème de menthe verte", "Liqueur"],
  falernum: ["Falernum", "Sirop"],
  "amaro montenegro": ["Amaro", "Liqueur"],
  "rumple minze": ["Schnaps à la menthe", "Liqueur"],
  apfelkorn: ["Schnaps à la pomme", "Liqueur"],
  pernod: ["Pernod", "Alcool"],
  "pisang ambon": ["Liqueur de banane verte", "Liqueur"],
  // Sucres / sirops
  sugar: ["Sucre", "Sucre"],
  "powdered sugar": ["Sucre glace", "Sucre"],
  "brown sugar": ["Sucre roux", "Sucre"],
  "demerara sugar": ["Sucre roux", "Sucre"],
  "sugar syrup": ["Sirop de sucre", "Sirop"],
  "simple syrup": ["Sirop de sucre", "Sirop"],
  "orgeat syrup": ["Sirop d'orgeat", "Sirop"],
  "raspberry syrup": ["Sirop de framboise", "Sirop"],
  "rosemary syrup": ["Sirop de romarin", "Sirop"],
  "ginger syrup": ["Sirop de gingembre", "Sirop"],
  "honey syrup": ["Sirop de miel", "Sirop"],
  "passion fruit syrup": ["Sirop de fruit de la passion", "Sirop"],
  "coconut syrup": ["Sirop de coco", "Sirop"],
  "vanilla syrup": ["Sirop de vanille", "Sirop"],
  "mint syrup": ["Sirop de menthe", "Sirop"],
  "chocolate syrup": ["Sirop de chocolat", "Sirop"],
  "corn syrup": ["Sirop de maïs", "Sirop"],
  "maple syrup": ["Sirop d'érable", "Sirop"],
  "agave syrup": ["Sirop d'agave", "Sirop"],
  "pineapple syrup": ["Sirop d'ananas", "Sirop"],
  honey: ["Miel", "Sucre"],
  grenadine: ["Grenadine", "Sirop"],
  // Jus / mixers non alcoolisés
  "orange juice": ["Jus d'orange", "Jus"],
  "lemon juice": ["Jus de citron", "Jus"],
  "lime juice": ["Jus de citron vert", "Jus"],
  "fresh lemon juice": ["Jus de citron", "Jus"],
  "fresh lime juice": ["Jus de citron vert", "Jus"],
  "roses sweetened lime juice": ["Jus de citron vert sucré", "Jus"],
  "pineapple juice": ["Jus d'ananas", "Jus"],
  "cranberry juice": ["Jus de cranberry", "Jus"],
  "grapefruit juice": ["Jus de pamplemousse", "Jus"],
  "apple juice": ["Jus de pomme", "Jus"],
  "grape juice": ["Jus de raisin", "Jus"],
  "tomato juice": ["Jus de tomate", "Jus"],
  "passion fruit juice": ["Jus de fruit de la passion", "Jus"],
  "pomegranate juice": ["Jus de grenade", "Jus"],
  "cherry juice": ["Jus de cerise", "Jus"],
  "fruit juice": ["Jus de fruits", "Jus"],
  "fruit punch": ["Punch aux fruits", "Jus"],
  limeade: ["Citronnade au citron vert", "Jus"],
  lemonade: ["Limonade", "Jus"],
  "pink lemonade": ["Limonade rose", "Jus"],
  "sweet and sour": ["Mix sweet & sour", "Jus"],
  "sour mix": ["Mix sweet & sour", "Jus"],
  "daiquiri mix": ["Mix daiquiri", "Jus"],
  "pina colada mix": ["Mix piña colada", "Jus"],
  // Eaux gazeuses / sodas
  water: ["Eau", "Autre"],
  "carbonated water": ["Eau gazeuse", "Effervescent"],
  "soda water": ["Eau gazeuse", "Effervescent"],
  "club soda": ["Eau gazeuse", "Effervescent"],
  "tonic water": ["Tonic", "Effervescent"],
  "bitter lemon": ["Bitter lemon", "Effervescent"],
  "ginger ale": ["Ginger ale", "Effervescent"],
  "ginger beer": ["Ginger beer", "Effervescent"],
  "coca-cola": ["Coca-Cola", "Soda"],
  "pepsi cola": ["Cola", "Soda"],
  "lemon-lime soda": ["Soda citron-citron vert", "Soda"],
  "7-up": ["Limonade pétillante", "Soda"],
  sprite: ["Limonade pétillante", "Soda"],
  fresca: ["Soda pamplemousse", "Soda"],
  "root beer": ["Root beer", "Soda"],
  "dr. pepper": ["Soda aux épices", "Soda"],
  "mountain dew": ["Soda citron", "Soda"],
  "grape soda": ["Soda au raisin", "Soda"],
  "kool-aid": ["Boisson en poudre aromatisée", "Soda"],
  "carbonated soft drink": ["Soda", "Soda"],
  surge: ["Soda", "Soda"],
  zima: ["Soda alcoolisé", "Soda"],
  "schweppes russchian": ["Soda aux agrumes", "Soda"],
  // Café / thé / chocolat
  coffee: ["Café", "Autre"],
  espresso: ["Espresso", "Autre"],
  "hot chocolate": ["Chocolat chaud", "Autre"],
  chocolate: ["Chocolat", "Autre"],
  "cocoa powder": ["Cacao en poudre", "Autre"],
  tea: ["Thé", "Autre"],
  "iced tea": ["Thé glacé", "Autre"],
  // Laitier / œufs
  milk: ["Lait", "Autre"],
  cream: ["Crème", "Autre"],
  "light cream": ["Crème légère", "Autre"],
  "heavy cream": ["Crème épaisse", "Autre"],
  "whipping cream": ["Crème à fouetter", "Autre"],
  "whipped cream": ["Crème fouettée", "Autre"],
  "half-and-half": ["Mélange lait-crème", "Autre"],
  "condensed milk": ["Lait concentré", "Autre"],
  "coconut milk": ["Lait de coco", "Autre"],
  "cream of coconut": ["Crème de coco", "Autre"],
  yoghurt: ["Yaourt", "Autre"],
  "vanilla ice-cream": ["Glace vanille", "Autre"],
  sherbet: ["Sorbet", "Autre"],
  egg: ["Œuf", "Autre"],
  "egg white": ["Blanc d'œuf", "Autre"],
  "egg yolk": ["Jaune d'œuf", "Autre"],
  butter: ["Beurre", "Autre"],
  // Fruits
  lemon: ["Citron", "Fruit"],
  lime: ["Citron vert", "Fruit"],
  orange: ["Orange", "Fruit"],
  "blood orange": ["Orange sanguine", "Fruit"],
  pineapple: ["Ananas", "Fruit"],
  banana: ["Banane", "Fruit"],
  apple: ["Pomme", "Fruit"],
  kiwi: ["Kiwi", "Fruit"],
  mango: ["Mangue", "Fruit"],
  papaya: ["Papaye", "Fruit"],
  strawberries: ["Fraises", "Fruit"],
  blackberries: ["Mûres", "Fruit"],
  cherries: ["Cerises", "Fruit"],
  figs: ["Figues", "Fruit"],
  cherry: ["Cerise", "Fruit"],
  "maraschino cherry": ["Cerise confite", "Fruit"],
  fruit: ["Fruits", "Fruit"],
  "lemon peel": ["Zeste de citron", "Fruit"],
  "orange peel": ["Zeste d'orange", "Fruit"],
  "lime peel": ["Zeste de citron vert", "Fruit"],
  "orange spiral": ["Spirale d'orange", "Fruit"],
  olive: ["Olive", "Fruit"],
  cucumber: ["Concombre", "Fruit"],
  // Herbes / épices
  mint: ["Menthe fraîche", "Herbe"],
  rosemary: ["Romarin", "Herbe"],
  thyme: ["Thym", "Herbe"],
  lavender: ["Lavande", "Herbe"],
  rose: ["Rose", "Herbe"],
  ginger: ["Gingembre", "Épice"],
  cinnamon: ["Cannelle", "Épice"],
  cloves: ["Clous de girofle", "Épice"],
  nutmeg: ["Muscade", "Épice"],
  cardamom: ["Cardamome", "Épice"],
  coriander: ["Coriandre", "Épice"],
  "cumin seed": ["Graines de cumin", "Épice"],
  allspice: ["Quatre-épices", "Épice"],
  "black pepper": ["Poivre noir", "Épice"],
  "cayenne pepper": ["Poivre de Cayenne", "Épice"],
  "red chili flakes": ["Piment en flocons", "Épice"],
  pepper: ["Poivre", "Épice"],
  salt: ["Sel", "Épice"],
  "celery salt": ["Sel de céleri", "Épice"],
  "vanilla extract": ["Extrait de vanille", "Épice"],
  vanilla: ["Vanille", "Épice"],
  asafoetida: ["Asafoetida", "Épice"],
  wormwood: ["Absinthe (plante)", "Herbe"],
  // Bitters / sauces
  bitters: ["Bitter", "Bitter"],
  "angostura bitters": ["Angostura", "Bitter"],
  "orange bitters": ["Bitter à l'orange", "Bitter"],
  "peach bitters": ["Bitter à la pêche", "Bitter"],
  "peychaud bitters": ["Peychaud's bitters", "Bitter"],
  "tabasco sauce": ["Tabasco", "Autre"],
  "hot sauce": ["Sauce piquante", "Autre"],
  "worcestershire sauce": ["Sauce Worcestershire", "Autre"],
  "soy sauce": ["Sauce soja", "Autre"],
  // Divers
  ice: ["Glace", "Autre"],
  marshmallows: ["Chamallows", "Autre"],
  "oreo cookie": ["Biscuit Oreo", "Autre"],
  jello: ["Gelée aromatisée", "Autre"],
  "caramel coloring": ["Colorant caramel", "Autre"],
  "almond flavoring": ["Arôme d'amande", "Autre"],
  "blackcurrant cordial": ["Sirop de cassis", "Sirop"],
  "olive brine": ["Saumure d'olive", "Autre"],
  "sirup of roses": ["Sirop de rose", "Sirop"],
  "bacardi limon": ["Bacardi citron", "Alcool"],
  "apricot nectar": ["Nectar d'abricot", "Jus"],
  "peach nectar": ["Nectar de pêche", "Jus"],
  sarsaparilla: ["Salsepareille", "Soda"],
};

// Rempli au démarrage de main() à partir des ingrédients déjà curatés à la
// main (nom -> slug) : leurs slugs sont parfois volontairement raccourcis
// ("sirop de sucre" -> "sirop_sucre", sans le "de") plutôt que dérivés
// mécaniquement du nom. Sans ce recalage, une traduction qui reproduit
// exactement le même nom mais dérive son propre slug créerait un doublon
// silencieux (deux entrées différentes pour "Menthe fraîche" par ex.),
// invisible dans le JSON mais visible comme deux chips identiques dans l'UI.
let existingSlugByName = new Map();

function translateIngredient(rawName) {
  const key = rawName.trim().toLowerCase().replace(/\s+/g, " ");
  const hit = ING[key];
  const translated = hit ? { name: hit[0], category: hit[1] } : { name: rawName.trim(), category: "Autre" };
  const existingSlug = existingSlugByName.get(translated.name.trim().toLowerCase());
  return existingSlug ? { ...translated, slugOverride: existingSlug } : translated;
  // Repli sans correspondance : nom anglais tel quel, catégorie générique —
  // documenté comme limite connue (voir README) plutôt que de deviner une
  // traduction fausse.
}

const SPIRIT_KEYWORDS = [
  "rhum", "vodka", "gin", "whisky", "bourbon", "scotch", "tequila", "mezcal", "brandy", "cognac", "cachaça", "pisco",
];

function isSpirit(translatedName) {
  const n = translatedName.toLowerCase();
  return SPIRIT_KEYWORDS.some((k) => n.includes(k));
}

const GARNISH_KEYWORDS = [
  "zeste", "cerise confite", "olive", "spirale", "menthe fraîche", "muscade", "cannelle",
];

function isGarnish(translatedName) {
  const n = translatedName.toLowerCase();
  return GARNISH_KEYWORDS.some((k) => n.includes(k));
}

// Rôle pondéré (voir domain/types.ts INGREDIENT_ROLE_WEIGHT) : le moteur de
// matching a besoin d'un rôle cohérent, pas seulement d'une catégorie.
function roleFor(translatedName, category, isFirst) {
  if (category === "Alcool" && isSpirit(translatedName)) return isFirst ? "primarySpirit" : "secondarySpirit";
  if (category === "Alcool" || category === "Liqueur") return "secondarySpirit";
  if (isGarnish(translatedName)) return "garnish";
  if (["Jus", "Soda", "Effervescent"].includes(category) || translatedName.toLowerCase().includes("eau")) return "mixer";
  return "modifier";
}

const GLASS_TRANSLATIONS = {
  "cocktail glass": "Verre à cocktail",
  "highball glass": "Verre Highball",
  "old-fashioned glass": "Verre Old Fashioned",
  "shot glass": "Verre à shot",
  "collins glass": "Verre Collins",
  "champagne flute": "Flûte à champagne",
  "martini glass": "Verre à Martini",
  "whiskey glass": "Verre à whisky",
  "whiskey sour glass": "Verre à whisky sour",
  "beer mug": "Chope à bière",
  "beer glass": "Verre à bière",
  "beer pilsner": "Verre à bière pils",
  "irish coffee cup": "Tasse à Irish coffee",
  "coffee mug": "Tasse",
  "punch bowl": "Bol à punch",
  "pint glass": "Verre à pinte",
  "wine glass": "Verre à vin",
  "white wine glass": "Verre à vin blanc",
  "hurricane glass": "Verre Hurricane",
  "margarita/coupette glass": "Verre à Margarita",
  "margarita glass": "Verre à Margarita",
  "nick and nora glass": "Verre Nick and Nora",
  "copper mug": "Mug en cuivre",
  "brandy snifter": "Verre Ballon",
  "mason jar": "Bocal Mason",
  "parfait glass": "Verre à parfait",
  "white wine goblet": "Verre à vin blanc",
  "balloon glass": "Verre Ballon",
  "pousse cafe glass": "Verre à pousse-café",
  "sherry glass": "Verre à Xérès",
  "cordial glass": "Verre à liqueur",
  "coupe glass": "Coupe",
  "punch glass": "Verre à punch",
  pitcher: "Pichet",
  jar: "Bocal",
};

function translateGlass(strGlass) {
  if (!strGlass) return "Verre au choix";
  const key = strGlass.trim().toLowerCase();
  return GLASS_TRANSLATIONS[key] ?? strGlass.trim();
}

function categoryFor(drink, translatedIngredients) {
  if (drink.strAlcoholic === "Non alcoholic") return "Sans alcool";
  const names = translatedIngredients.map((i) => i.name.toLowerCase());
  const hasRum = names.some((n) => n.includes("rhum"));
  const hasTropicalFruit = names.some((n) => n.includes("ananas") || n.includes("coco") || n.includes("fruit de la passion") || n.includes("mangue"));
  if (hasRum && hasTropicalFruit) return "Tropical";
  return "Classique";
}

function difficultyFor(ingredientCount) {
  if (ingredientCount <= 3) return 1;
  if (ingredientCount <= 5) return 2;
  return 3;
}

function iceTypeFor(instructions) {
  const t = instructions.toLowerCase();
  if (t.includes("crushed ice")) return "Glace pilée";
  if (t.includes("without ice") || t.includes("no ice")) return "Sans glace";
  return "Glaçons";
}

// "1 3/4 shot", "2 oz", "1/2 cl", "Juice of 1 lemon", "A dash of" ...
function parseMeasure(raw) {
  if (!raw || !raw.trim()) return { quantity: 1, unit: "mesure" };
  const s = raw.trim().toLowerCase();

  const fractionMatch = s.match(/(\d+)?\s*(\d+)\/(\d+)/);
  let quantity = null;
  if (fractionMatch) {
    const whole = fractionMatch[1] ? Number(fractionMatch[1]) : 0;
    quantity = whole + Number(fractionMatch[2]) / Number(fractionMatch[3]);
  } else {
    const numMatch = s.match(/(\d+(\.\d+)?)/);
    if (numMatch) quantity = Number(numMatch[1]);
  }

  let unit = "mesure";
  if (s.includes("cl")) unit = "cl";
  else if (s.includes("oz")) unit = "oz";
  else if (s.includes("ml")) unit = "ml";
  else if (s.includes("shot")) unit = "shot";
  else if (s.includes("dash")) unit = "trait";
  else if (s.includes("splash")) unit = "trait";
  else if (s.includes("tsp") || s.includes("teaspoon")) unit = "cc";
  else if (s.includes("tbsp") || s.includes("tablespoon")) unit = "cs";
  else if (s.includes("cup")) unit = "tasse";
  else if (s.includes("can")) unit = "canette";
  else if (s.includes("bottle")) unit = "bouteille";
  else if (s.includes("slice")) unit = "tranche";
  else if (s.includes("wedge")) unit = "quartier";
  else if (s.includes("piece") || s.includes("whole")) unit = "pièce";
  else if (s.includes("scoop")) unit = "boule";
  else if (quantity === null) unit = "mesure";

  return { quantity: quantity ?? 1, unit };
}

function splitInstructions(text) {
  if (!text || !text.trim()) return [{ order: 1, instruction: "Mélanger et servir.", durationSeconds: null }];
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const steps = sentences.length > 0 ? sentences : [text.trim()];
  return steps.map((instruction, i) => ({ order: i + 1, instruction, durationSeconds: null }));
}

function transformDrink(drink) {
  const rawIngredients = [];
  for (let i = 1; i <= 15; i++) {
    const name = drink[`strIngredient${i}`];
    if (name && name.trim()) rawIngredients.push({ name, measure: drink[`strMeasure${i}`] });
  }
  if (rawIngredients.length === 0) return null;

  let firstSpiritAssigned = false;
  const ingredients = rawIngredients.map(({ name, measure }) => {
    const { name: trName, category, slugOverride } = translateIngredient(name);
    const { quantity, unit } = parseMeasure(measure);
    const isFirstSpirit = category === "Alcool" && isSpirit(trName) && !firstSpiritAssigned;
    if (isFirstSpirit) firstSpiritAssigned = true;
    return {
      slug: slugOverride ?? slugify(trName),
      name: trName,
      category,
      colorHex: null,
      quantity,
      unit,
      isOptional: false,
      role: roleFor(trName, category, isFirstSpirit),
    };
  });

  const mainSpiritIngredient = ingredients.find((i) => i.role === "primarySpirit");
  const mainSpirit = mainSpiritIngredient?.name ?? (drink.strAlcoholic === "Non alcoholic" ? "Aucun" : ingredients[0]?.name ?? "Aucun");

  const garnishIngredient = ingredients.find((i) => i.role === "garnish");

  return {
    name: drink.strDrink.trim(),
    category: categoryFor(drink, ingredients),
    origin: "International",
    history: null,
    difficulty: difficultyFor(ingredients.length),
    mainSpirit,
    preparationTimeMinutes: 3,
    glassware: translateGlass(drink.strGlass),
    iceType: iceTypeFor(drink.strInstructions ?? ""),
    garnish: garnishIngredient?.name ?? "Libre",
    tips: null,
    imageURL: drink.strDrinkThumb ?? "",
    ingredients,
    steps: splitInstructions(drink.strInstructions),
    _sourceId: drink.idDrink,
  };
}

async function fetchAllDrinks() {
  const byId = new Map();
  for (const letter of LETTERS) {
    const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`);
    const data = await res.json();
    for (const drink of data.drinks ?? []) {
      if (!byId.has(drink.idDrink)) byId.set(drink.idDrink, drink);
    }
  }
  return [...byId.values()];
}

async function main() {
  const existingRaw = JSON.parse(await readFile(COCKTAILS_PATH, "utf-8"));
  const existingSlugs = new Set(existingRaw.map((c) => slugify(c.name)));

  for (const cocktail of existingRaw) {
    for (const link of cocktail.ingredients) {
      existingSlugByName.set(link.name.trim().toLowerCase(), link.slug);
    }
  }

  console.log("Récupération du catalogue TheCocktailDB (a-z, 0-9)...");
  const drinks = await fetchAllDrinks();
  console.log(`${drinks.length} cocktails uniques récupérés.`);

  const usedSlugs = new Set(existingSlugs);
  const imported = [];
  let skippedDuplicates = 0;

  for (const drink of drinks) {
    const transformed = transformDrink(drink);
    if (!transformed) continue;

    const baseSlug = slugify(transformed.name);
    if (existingSlugs.has(baseSlug)) {
      skippedDuplicates++;
      continue; // garde la version curatée à la main
    }
    // L'id d'un cocktail est toujours dérivé de son nom (slugify(name), voir
    // seed.ts) — il n'y a pas de champ id séparé à renommer. En cas de
    // collision (ex: TheCocktailDB contient parfois deux fiches pour le même
    // nom avec une apostrophe différente — "Planter's Punch" vs "Planter’s
    // Punch"), on désambiguïse donc le NOM lui-même plutôt que de calculer un
    // slug qui ne serait jamais utilisé.
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      transformed.name = `${transformed.name} (${suffix})`;
      slug = slugify(transformed.name);
      suffix++;
    }
    usedSlugs.add(slug);

    delete transformed._sourceId;
    imported.push(transformed);
  }

  const merged = [...existingRaw, ...imported];
  await writeFile(COCKTAILS_PATH, `${JSON.stringify(merged, null, 2)}\n`);

  console.log(`${imported.length} nouveaux cocktails importés (${skippedDuplicates} doublons avec le catalogue curaté ignorés).`);
  console.log(`Catalogue total : ${merged.length} cocktails.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
