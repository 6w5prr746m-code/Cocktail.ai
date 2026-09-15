# Cocktail.ai Web

Version web équivalente de l'app iOS Cocktail.ai (SwiftUI / SwiftData), construite pour être **testée dans un navigateur et déployée en un clic** sur n'importe quel hébergeur de sites statiques.

Stack : **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + Zustand** (persistance `localStorage`). Aucun backend, aucune base de données, aucune clé d'API — tout tourne côté client, comme un PWA installable.

## Lancer en local

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # build de prod dans dist/
npm run preview    # sert le build de prod localement
```

## Tests

```bash
npm test           # tests unitaires (Vitest) — moteur de matching, formatage, BarReadiness
npm run test:watch # idem, en mode watch
npm run test:e2e   # parcours critiques bout en bout (Playwright) — lance automatiquement le serveur de dev
```

Les tests unitaires du moteur de matching (`src/domain/matchingEngine.test.ts`) portent les 21 cas de `Tests/MatchingEngineTests.swift` et `Tests/MatchingEngineV2Tests.swift` de l'app iOS (le seul cas non porté est celui des variantes, fonctionnalité pas encore implémentée côté web). Un des cas Swift portés tel quel s'est révélé faux à l'exécution — attendu, puisque l'app iOS n'a jamais réellement compilé (voir le README racine) : le test a été corrigé plutôt que reporté à l'identique, voir le commentaire dans le fichier.

Une CI GitHub Actions (`.github/workflows/ci.yml`) exécute build + tests unitaires + tests e2e sur chaque pull request touchant `web/`.

## Déployer

Le build produit un site 100% statique (`dist/`). Plusieurs options, toutes gratuites pour ce type de projet :

### GitHub Pages (déjà configuré dans ce repo)

Un workflow GitHub Actions (`.github/workflows/deploy-web.yml`) build et déploie automatiquement `web/` sur GitHub Pages.

**Étape unique à faire une fois, côté réglages du repo** (pas de code à toucher) :
1. Sur GitHub → onglet **Settings** du repo → **Pages** (menu de gauche)
2. Sous "Build and deployment" → **Source** → choisir **GitHub Actions**

Ensuite :
- Chaque push sur `main` qui touche `web/**` redéploie automatiquement.
- Pour déployer dès maintenant sans attendre un merge sur `main` : onglet **Actions** → workflow **"Deploy web app to GitHub Pages"** → **Run workflow** → choisir la branche → Run.

Le site sera servi sur `https://<owner>.github.io/<nom-du-repo>/` (ex: `https://6w5prr746m-code.github.io/Cocktail.ai/`). Le build est fait avec `--base=/<nom-du-repo>/` automatiquement par le workflow, et `public/404.html` + le script de décodage dans `index.html` gèrent le routing côté client (GitHub Pages n'a pas de rewrite serveur pour une SPA) — les URLs profondes comme `/cocktail/mojito` fonctionnent normalement.

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Le fichier `vercel.json` fourni redirige toutes les routes vers `index.html` (indispensable pour le routing côté client type `/cocktail/mojito`).

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```
`netlify.toml` est déjà configuré (build command, publish dir, redirects SPA).

### N'importe quel hébergeur statique (GitHub Pages, Cloudflare Pages, S3+CloudFront, etc.)
Il suffit de servir le contenu de `dist/` et de rediriger toute route inconnue vers `index.html` (mode SPA "history fallback").

## Ce qui a été porté depuis l'app iOS

Cette version reprend fidèlement le cœur produit de l'app native décrite dans le `README.md` racine (sprints 0 à 12 + Sprint My Bar 2.0 + Sprint Matching Engine V2) :

- **Recherche magique par ingrédients** (`/picker`) — sélection en temps réel, résultats triés par score de compatibilité (Moteur V1).
- **Bibliothèque** (`/library`) — recherche nom + ingrédient, filtres alcool principal / difficulté / occasion, collections thématiques.
- **Mon Bar** (`/mybar`) — inventaire avec statut de stock (disponible / faible / presque terminé), quantité approximative, et **intégration réelle au Matching Engine V2** (pondération par rôle d'ingrédient, dégradation de stock, substitutions) pour calculer le nombre de cocktails réellement déblocables.
- **Fiche cocktail** (`/cocktail/:id`) — ingrédients avec quantités et rôles, étapes de préparation, histoire, conseils, favori, partage, édition (recettes perso).
- **Mode préparation** (`/cocktail/:id/prepare`) — plein écran, étape par étape, timer en anneau (Liquid Ring) pour les étapes chronométrées, écran de fin, enregistrement dans l'historique. Utilise la Wake Lock API du navigateur pour garder l'écran allumé quand elle est disponible.
- **Favoris** et **Historique** (`/favorites`, `/profile`).
- **Création / modification de recettes perso** (`/recipe/new`, `/recipe/:id/edit`) — formulaire complet ingrédients + étapes, réutilise le référentiel d'ingrédients existant (recherche insensible à la casse) comme sur iOS.
- **Partage visuel** (`/cocktail/:id/share`) — carte générée en `<canvas>` (dégradé de famille, nom, ingrédients, QR code pointant vers la fiche), export PNG + Web Share API sur mobile.
- **Dark/Light mode**, palette et typographie fidèles au Design System iOS (`DesignSystem/Colors.swift`, `Typography.swift`).
- Les **14 cocktails curatés à la main, 7 collections et 6 substitutions** du seed iOS sont repris tels quels (`src/data/*.json`, copiés depuis `Resources/SeedData/`) — voir aussi "Catalogue étendu" ci-dessous pour les 430 cocktails/mocktails ajoutés au Sprint 10.

Le moteur de matching (`src/domain/matchingEngine.ts`) est un **portage ligne à ligne** de `Services/MatchingEngine.swift` : mêmes poids par rôle (alcool principal 1.0, secondaire 0.8, structurant 0.6, mixer 0.35, garniture 0.15), mêmes règles de dégradation de stock (1.0 / 0.75 / 0.4), même seuil d'exclusion (2 ingrédients manquants max), V1 et V2 strictement séparés comme dans le code Swift.

**Le moteur V2 est exposé dans l'interface, pas seulement dans le calcul** : Mon Bar affiche une section "Presque prêt" (cocktails à un ou deux ingrédients près, triés par score) en plus du compteur de cocktails débloqués ; la fiche cocktail confronte la recette à Mon Bar dès qu'il contient au moins un ingrédient et annote chaque ligne (✓ disponible, ⚠ dégradé avec la raison — stock faible/presque terminé/substitution —, ✗ manquant) plutôt que de se contenter d'un score global. Une **liste de courses** (`src/state/shoppingList.ts`, persistée) se remplit en un tap depuis "Presque prêt" ou depuis une fiche cocktail, et vit dans l'onglet Mon Bar.

## Différences assumées par rapport à l'app iOS

- **Pas de compte ni de synchronisation multi-appareil.** L'app iOS synchronise Mon Bar/Favoris/Historique via CloudKit ; ici tout est stocké dans le `localStorage` du navigateur (documenté à l'utilisateur dans l'écran Profil). C'est la limitation structurelle attendue d'une version web sans backend — un vrai compte nécessiterait une API et une base de données.
- **Deep linking natif, pas un schéma d'URL custom.** Là où l'app iOS a dû construire tout un système `cocktailapp://` (Sprint 12), le web a l'avantage d'avoir des URLs directement partageables (`/cocktail/mojito`) — aucune configuration supplémentaire n'est nécessaire.
- **Pas de widget d'écran d'accueil ni de notifications push** — équivalents natifs sans équivalent web direct pris en charge ici.
- **Icônes** : emoji plutôt que SF Symbols/illustrations dédiées (aucun asset graphique livré avec le projet iOS au-delà de l'icône d'app).
- **"Populaires"** reste une heuristique simple (classiques d'abord), comme l'app iOS — pas de donnée d'usage communautaire disponible côté web pour la remplacer. **"Recommandés pour toi"**, en revanche, n'est plus une heuristique statique depuis le Sprint 7 : voir la section Découverte ci-dessous.

## Découverte & recherche

- **"Recommandés pour toi"** (`src/domain/recommendation.ts`) pondère les cocktails non déjà favoris/préparés par affinité avec l'alcool principal et le profil de goût (`tasteProfile`) des cocktails que l'utilisateur a favorisés ou déjà préparés (historique) — un sous-titre ("Basé sur tes favoris et cocktails déjà préparés") apparaît dès qu'un signal existe. Sans aucun signal (nouvel utilisateur), retombe sur le tri par difficulté croissante utilisé auparavant : aucune régression pour un compte neuf.
- **"Surprends-moi" (🎲, à côté du bouton de recherche magique sur l'accueil)** tire un cocktail au hasard, en évitant si possible ceux déjà favoris ou préparés — pour une vraie découverte plutôt qu'un remix des mêmes noms.
- **Recherche floue** (`src/domain/fuzzySearch.ts`) sur la Bibliothèque, Mon Bar et la recherche magique : insensible aux accents ("cafe" retrouve "Café") et tolérante aux fautes de frappe légères sur un mot (distance de Levenshtein mot à mot, ex: "mojto" retrouve "Mojito") — sans dépendance externe, le catalogue est assez petit pour comparer en clair à chaque frappe.

## Historique & statistiques

L'onglet Profil affiche un bloc "Statistiques" (`src/domain/historyStats.ts`, masqué tant que l'historique est vide) calculé à partir des cocktails préparés jusqu'au bout en Mode préparation :

- **Total préparé** et **ce mois-ci** (compte simple).
- **Série en cours** 🔥 — jours consécutifs avec au moins une préparation, jusqu'à aujourd'hui ; si rien n'est encore préparé aujourd'hui la série reste affichée tant qu'hier compte (elle n'est pas encore rompue). Bascule sur la **série record** une fois la série en cours retombée à 0, pour ne jamais perdre le meilleur score.
- **Cocktail favori** — celui préparé le plus de fois, avec son nombre de préparations, lien direct vers sa fiche.

Tout est calculé côté client sur le fuseau horaire local de l'utilisateur, cohérent avec le reste de l'historique (pas de synchronisation multi-appareil, voir plus bas).

## Structure du code

```
src/
  data/            JSON du seed (copié depuis Resources/SeedData de l'app iOS)
  domain/          Types, moteur de matching V1/V2, formatage, dégradés, catalogue
  state/           Stores Zustand persistés (favoris, Mon Bar, historique, recettes perso, thème)
  components/      UI partagée (CompatibilityRing, CocktailCard, IngredientChip, TabBar...)
  pages/           Un fichier par écran, routés dans App.tsx
```

## Identité visuelle des cocktails

Chaque cocktail est représenté par une illustration de verre générée en SVG (`src/domain/glassArt.ts` + `src/components/GlassArt.tsx`) : forme du verre, couleur du liquide, glace et garniture curatées à la main pour les 14 cocktails d'origine du seed (heuristique de repli, basée sur la catégorie et les ingrédients, pour les recettes perso et les 430 cocktails importés du Sprint 10).

**Photos réalistes (optionnel, progressif)** : `src/components/CocktailVisual.tsx` tente de charger deux variantes WebP par cocktail — `public/images/cocktails/<id>-thumb.webp` (480px, cartes/listes) et `<id>.webp` (960px, fiche détail/cocktail du jour) ; si le fichier existe, la photo remplace l'illustration partout où `CocktailVisual` est utilisé ; sinon ça retombe silencieusement sur l'illustration — aucune configuration ni changement de code nécessaire.

**Générer une photo pour un nouveau cocktail** :
1. Sur la fiche de n'importe quel cocktail (seed ou recette perso), le bouton 📸 dans la barre du haut copie dans le presse-papier un prompt de génération d'image prêt à coller dans Gemini/Imagen (`src/domain/photoPrompt.ts` — même bloc de style pour tous, surface/lumière/cadrage cohérents ; les détails du verre/glace/garniture/couleur sont dérivés de l'illustration curatée du cocktail, avec un repli automatique par teinte pour les recettes perso).
2. Déposer l'image générée (JPEG ou PNG, idéalement carrée, 1024×1024 ou plus) sous `public/images/cocktails/<id-du-cocktail>.jpg` (les ids sont les slugs visibles dans `src/data/cocktails.json`, ex: `mojito.jpg`).
3. Lancer `npm run images:optimize` — génère les deux variantes WebP (via `sharp`) et supprime le fichier source. Diminue le poids d'environ 65% par rapport au JPEG d'origine, sans perte visible.

## PWA — app installable et hors ligne

Le build génère une vraie Progressive Web App via `vite-plugin-pwa` (`vite.config.ts`) :

- **Installable** sur Android/desktop (bouton natif via `beforeinstallprompt`, relayé par une carte dans l'onglet Profil — `src/components/InstallAppCard.tsx`) et sur iOS (instructions "Partager → Sur l'écran d'accueil", Safari n'exposant pas d'API d'installation programmatique).
- **Fonctionne hors ligne** : un service worker (Workbox, `registerType: 'autoUpdate'`) précache le shell de l'app (JS/CSS/HTML) et met en cache les photos de cocktails au fil de la navigation (`CacheFirst`, 90 jours) — un cocktail déjà consulté reste consultable sans réseau, y compris après un rechargement complet.
- Icônes (`public/icons/`) : un verre à cocktail doré sur fond sombre, cohérent avec le Design System.
- Le manifest (`manifest.webmanifest`, généré au build) respecte automatiquement le `--base` passé en CI (fonctionne aussi bien en local qu'en sous-chemin GitHub Pages).

## Onboarding premier lancement

Au tout premier lancement (`src/components/OnboardingFlow.tsx`, état persisté dans `src/state/onboarding.ts`), un écran plein écran en 3 étapes explique l'app avant de laisser l'utilisateur entrer : présentation générale, recherche magique, puis Mon Bar — cette dernière étape propose directement les 6 ingrédients les plus utilisés du catalogue (`src/domain/starterIngredients.ts`, calculés depuis le seed plutôt que codés en dur) à ajouter en un tap. "Passer" est toujours disponible et saute l'écran sans rien ajouter. Mon Bar affiche par ailleurs son propre état vide engageant (mêmes ingrédients suggérés) tant qu'aucun ingrédient n'a été renseigné, onboarding vu ou non.

## Accessibilité

- **Contraste** : les couleurs d'accent (or, rouge, vert) ont chacune une variante `-text` (`--color-accent-gold-text`, `--color-danger-text`, `--color-success-text` dans `src/index.css`) utilisée partout où la couleur porte du texte ou une icône porteuse de sens — la couleur de base reste réservée aux fonds de bouton. En light mode ces variantes sont volontairement assombries pour rester ≥ 4.5:1 (vérifié à l'audit Lighthouse, voir plus bas) ; en dark mode elles valent la couleur de base, déjà largement conforme. Les opacités appliquées directement sur du texte (`opacity-60`/`70`/`80` combinées à `--color-text-secondary`) ont été retirées ou déplacées sur les seuls éléments décoratifs (illustrations `GlassArt`), car elles faisaient chuter le contraste sous le seuil AA.
- **Structure de titres** : une seule hiérarchie `h1 → h2` par écran (les titres de section qui utilisaient `h3` sans `h2` intermédiaire sont passés à `h2` ; `ScreenHeader` rend son `title` en `h1` puisqu'il est systématiquement l'unique titre de l'écran où il apparaît).
- **Landmark `<main>`** : chaque écran est entouré d'un repère `<main id="main-content">` (le `TabLayout` pour les onglets, un wrapper `display:contents` pour les écrans plein écran routés directement — landmark sans toucher à la mise en page existante). Un lien d'évitement ("Aller au contenu", `App.tsx` + `.skip-link` dans `index.css`) apparaît au premier `Tab` et saute directement dessus.
- **Focus clavier** : un anneau de focus cohérent (`:focus-visible`) est appliqué à tous les éléments interactifs, y compris les champs texte qui utilisaient `outline-none` pour supprimer l'anneau par défaut au clic souris.
- **Formulaires** : tous les champs de recherche/texte ont un nom accessible explicite (`aria-label`, en plus ou à la place du `placeholder`) ; les `<select>` du formulaire de recette (catégorie, difficulté, rôle d'ingrédient) aussi.
- Audité avec `npx lighthouse --only-categories=accessibility` sur les 8 écrans principaux (accueil, bibliothèque, Mon Bar, fiche cocktail, formulaire de recette, profil, favoris, recherche magique) : **100/100** partout.
- `public/robots.txt` autorise l'indexation (site 100% public, aucune donnée sensible).

## Partage enrichi

- **5 formats de partage visuel** (`src/pages/Share.tsx`), désormais à parité avec le PRD iOS (`Domain/Models/ShareFormat.swift`) : Story, Post, TikTok, Pinterest, Snapchat — mêmes ratios (Story/TikTok/Snapchat en 9:16, Post en 4:5, Pinterest en 2:3). Le ratio du format Post a aussi été corrigé au passage : ce portage utilisait un carré 1:1 plutôt que le 4:5 de l'app native.
- **Lien de recette perso autoporteur** (`src/domain/recipeShareCode.ts`) : une recette créée par l'utilisateur n'existe que dans son `localStorage` — un lien `/cocktail/<id>` classique serait mort pour n'importe qui d'autre. Le bouton "🔗 Copier le lien de la recette" sur l'écran de partage (visible uniquement pour les recettes perso) encode un instantané complet de la recette — ingrédients *dénormalisés* avec leur nom, pas seulement leur id, pour rester lisible même si le destinataire n'a jamais vu cet ingrédient perso — directement dans l'URL (`/shared/<recette encodée en base64url>`), sans backend. Le QR code du visuel de partage pointe aussi vers ce lien pour les recettes perso (vers la fiche classique pour les cocktails du catalogue, universellement partageable).
- **`src/pages/SharedRecipe.tsx`** affiche cette recette en lecture seule (aucune dépendance au référentiel d'ingrédients local) avec un bouton "Enregistrer dans mes recettes" : les ingrédients perso inconnus du destinataire sont alors créés localement via le même `findOrCreate` que le formulaire de recette, pour que la fiche complète (Mon Bar, mode préparation...) fonctionne normalement une fois enregistrée.

## Catalogue étendu

Le catalogue est passé de 14 à **444 cocktails/mocktails** au Sprint 10, via un pipeline d'import réutilisable plutôt qu'une saisie manuelle :

- **Source** : [TheCocktailDB](https://www.thecocktaildb.com) (clé de test gratuite "1"), une base crowd-sourcée gratuite dont les conditions d'utilisation autorisent explicitement à *"scraper, copier et modifier tout contenu retourné par l'API via les endpoints officiels"*, pour un usage de développement — y compris une app web tant qu'elle n'est pas publiée sur un app store. 441 cocktails uniques y sont accessibles gratuitement (recherche exhaustive par première lettre, a-z + 0-9), dont 40 sans alcool (mocktails) — c'est le plafond du niveau gratuit ; la base "complète" est réservée aux abonnés Premium (10$, usage personnel).
- **`npm run import:cocktaildb`** (`scripts/import-cocktaildb.mjs`) : récupère le catalogue, le transforme vers le schéma interne et fusionne le résultat dans `src/data/cocktails.json`, en gardant la version curatée à la main pour les 11 cocktails déjà présents dans les deux catalogues (dédoublonnage par nom). Réutilisable pour une future mise à jour du catalogue ou une nouvelle source.
- **Traduction** : les ingrédients (nom + catégorie) sont traduits en français via un dictionnaire couvrant 300 des 304 ingrédients distincts du catalogue source (99,5% des occurrences) ; les slugs sont recalés sur ceux déjà utilisés par les 14 recettes curatées quand le nom correspond exactement (ex: "Menthe fraîche" → `menthe`, pas un doublon `menthe_fraiche`), pour éviter deux entrées différentes pour le même ingrédient. Les noms de verre sont traduits de la même façon.
- **Heuristiques pour les champs absents de la source** : difficulté (déduite du nombre d'ingrédients), type de glace (déduit des instructions), garniture (déduite d'ingrédients repérés comme décoratifs), rôle de chaque ingrédient pour le moteur de matching (alcool principal/secondaire, mixer, garniture, structurant). Contrairement aux 14 recettes curatées, les 430 recettes importées n'ont ni histoire, ni conseils (`history`/`tips` à `null`), une origine générique ("International", TheCocktailDB ne fournit pas de pays d'origine — contrairement à sa base sœur TheMealDB), et des **étapes de préparation en anglais** (traduire fidèlement 430 paragraphes libres dépasse ce qu'un dictionnaire de traduction peut faire sans risquer un contresens ; documenté plutôt que deviné).
- **Filtre par pays** : pas encore implémenté, faute de donnée source fiable — prochaine étape si une source avec origine géographique est intégrée plus tard.
- Impact mesuré : build de prod OK (le chunk de données catalogue grossit mais reste un fichier séparé, mis en cache par le service worker) ; audit Lighthouse performance sur l'accueil toujours à **97/100** (250 Kio de poids total) malgré le catalogue ×31.

## Limites connues

- Comme documenté dans le README iOS pour la V1, deux noms d'ingrédients personnalisés produisant le même slug (accents) entreraient en conflit.
- Les 430 cocktails importés du Sprint 10 ont des étapes de préparation en anglais (voir "Catalogue étendu" ci-dessus) et une origine générique plutôt qu'un pays précis.
