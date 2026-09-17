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

**Le moteur V2 est exposé dans l'interface, pas seulement dans le calcul** : Mon Bar affiche une section "Presque prêt" (cocktails à un ou deux ingrédients près, triés par score) en plus du compteur de cocktails débloqués ; la fiche cocktail confronte la recette à Mon Bar dès qu'il contient au moins un ingrédient et annote chaque ligne (icône disponible, dégradé avec la raison — stock faible/presque terminé/substitution —, ou manquant) plutôt que de se contenter d'un score global. Une **liste de courses** (`src/state/shoppingList.ts`, persistée) se remplit en un tap depuis "Presque prêt" ou depuis une fiche cocktail, et vit dans l'onglet Mon Bar.

**"Prêts à préparer" sur l'accueil** (`Home.tsx`) : jusqu'ici, `availability === "ready"` (tous les ingrédients requis en stock "disponible", sans dégradation) n'existait qu'agrégé en un compteur dans l'anneau de compatibilité de Mon Bar — jamais sous forme de liste consultable. Une nouvelle section met en avant ces cocktails intégralement réalisables, juste après la bannière "presque prêt", même style que les autres collections de l'accueil (carrousel horizontal, `CocktailCard`) ; masquée quand Mon Bar est vide ou que rien n'est encore prêt.

## Différences assumées par rapport à l'app iOS

- **Pas de compte ni de synchronisation multi-appareil.** L'app iOS synchronise Mon Bar/Favoris/Historique via CloudKit ; ici tout est stocké dans le `localStorage` du navigateur (documenté à l'utilisateur dans l'écran Profil). C'est la limitation structurelle attendue d'une version web sans backend — un vrai compte nécessiterait une API et une base de données.
- **Deep linking natif, pas un schéma d'URL custom.** Là où l'app iOS a dû construire tout un système `cocktailapp://` (Sprint 12), le web a l'avantage d'avoir des URLs directement partageables (`/cocktail/mojito`) — aucune configuration supplémentaire n'est nécessaire.
- **Pas de widget d'écran d'accueil ni de notifications push** — équivalents natifs sans équivalent web direct pris en charge ici.
- **Icônes** : [Lucide](https://lucide.dev) (`lucide-react`), une bibliothèque d'icônes vectorielles à traits fins proche de l'esprit SF Symbols, plutôt que des illustrations dédiées (aucun asset graphique livré avec le projet iOS au-delà de l'icône d'app). Voir la section "Icônes" plus bas.
- **"Populaires"** reste une heuristique simple (classiques d'abord), comme l'app iOS — pas de donnée d'usage communautaire disponible côté web pour la remplacer. **"Recommandés pour toi"**, en revanche, n'est plus une heuristique statique depuis le Sprint 7 : voir la section Découverte ci-dessous.

## Découverte & recherche

- **"Recommandés pour toi"** (`src/domain/recommendation.ts`) pondère les cocktails non déjà favoris/préparés par affinité avec l'alcool principal et le profil de goût (`tasteProfile`) des cocktails que l'utilisateur a favorisés ou déjà préparés (historique) — un sous-titre ("Basé sur tes favoris et cocktails déjà préparés") apparaît dès qu'un signal existe. Sans aucun signal (nouvel utilisateur), retombe sur le tri par difficulté croissante utilisé auparavant : aucune régression pour un compte neuf.
- **"Surprends-moi" (dé à côté du bouton de recherche magique sur l'accueil)** tire un cocktail au hasard, en évitant si possible ceux déjà favoris ou préparés — pour une vraie découverte plutôt qu'un remix des mêmes noms.
- **Recherche floue** (`src/domain/fuzzySearch.ts`) sur la Bibliothèque, Mon Bar et la recherche magique : insensible aux accents ("cafe" retrouve "Café") et tolérante aux fautes de frappe légères sur un mot (distance de Levenshtein mot à mot, ex: "mojto" retrouve "Mojito") — sans dépendance externe, le catalogue est assez petit pour comparer en clair à chaque frappe.

## Historique & statistiques

L'onglet Profil affiche un bloc "Statistiques" (`src/domain/historyStats.ts`, masqué tant que l'historique est vide) calculé à partir des cocktails préparés jusqu'au bout en Mode préparation :

- **Total préparé** et **ce mois-ci** (compte simple).
- **Série en cours** (flamme) — jours consécutifs avec au moins une préparation, jusqu'à aujourd'hui ; si rien n'est encore préparé aujourd'hui la série reste affichée tant qu'hier compte (elle n'est pas encore rompue). Bascule sur la **série record** une fois la série en cours retombée à 0, pour ne jamais perdre le meilleur score.
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
1. Sur la fiche de n'importe quel cocktail (seed ou recette perso), le bouton appareil photo dans la barre du haut copie dans le presse-papier un prompt de génération d'image prêt à coller dans Gemini/Imagen (`src/domain/photoPrompt.ts` — même bloc de style pour tous, surface/lumière/cadrage cohérents ; les détails du verre/glace/garniture/couleur sont dérivés de l'illustration curatée du cocktail, avec un repli automatique par teinte pour les recettes perso).
2. Déposer l'image générée (JPEG ou PNG, idéalement carrée, 1024×1024 ou plus) sous `public/images/cocktails/<id-du-cocktail>.jpg` (les ids sont les slugs visibles dans `src/data/cocktails.json`, ex: `mojito.jpg`).
3. Lancer `npm run images:optimize` — génère les deux variantes WebP (via `sharp`) et supprime le fichier source. Diminue le poids d'environ 65% par rapport au JPEG d'origine, sans perte visible.

## Icônes

Toutes les icônes d'interface (barre de navigation, boutons, badges, en-têtes) viennent de [Lucide](https://lucide.dev) (`lucide-react`) — traits fins monochromes dans l'esprit SF Symbols, plutôt que des emoji (rendu incohérent d'une plateforme à l'autre, look daté). La barre de navigation (`src/components/navTabs.ts`, `TabBar.tsx`/`SideNav.tsx`) reste dans l'esprit "Réglages iOS" : icône blanche sur tuile colorée (desktop) ou icône simplement teintée à l'état actif (mobile).

Les jeux de badges/défis (`src/domain/achievements.ts`, `src/domain/monthlyChallenge.ts`) portent deux champs distincts : `icon` (composant Lucide, affiché à l'écran) et `emoji`/`canvasEmoji` (caractère Unicode, utilisé uniquement par `ShareCardModal.tsx` qui dessine la carte de partage sur un `<canvas>` via `ctx.fillText` — un composant React ne peut pas y être rendu directement). Deux exceptions assumées, sans équivalent Lucide : les drapeaux 🇫🇷/🇬🇧 du sélecteur de langue (`LanguagePicker.tsx`) et la référence au bouton natif "Partager" de Safari dans le texte d'installation iOS (`installCard.iosBody`).

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
- **Lien de recette perso autoporteur** (`src/domain/recipeShareCode.ts`) : une recette créée par l'utilisateur n'existe que dans son `localStorage` — un lien `/cocktail/<id>` classique serait mort pour n'importe qui d'autre. Le bouton "Copier le lien de la recette" sur l'écran de partage (visible uniquement pour les recettes perso) encode un instantané complet de la recette — ingrédients *dénormalisés* avec leur nom, pas seulement leur id, pour rester lisible même si le destinataire n'a jamais vu cet ingrédient perso — directement dans l'URL (`/shared/<recette encodée en base64url>`), sans backend. Le QR code du visuel de partage pointe aussi vers ce lien pour les recettes perso (vers la fiche classique pour les cocktails du catalogue, universellement partageable).
- **`src/pages/SharedRecipe.tsx`** affiche cette recette en lecture seule (aucune dépendance au référentiel d'ingrédients local) avec un bouton "Enregistrer dans mes recettes" : les ingrédients perso inconnus du destinataire sont alors créés localement via le même `findOrCreate` que le formulaire de recette, pour que la fiche complète (Mon Bar, mode préparation...) fonctionne normalement une fois enregistrée.

## Catalogue étendu

Le catalogue est passé de 14 à **444 cocktails/mocktails** au Sprint 10, via un pipeline d'import réutilisable plutôt qu'une saisie manuelle :

- **Source** : [TheCocktailDB](https://www.thecocktaildb.com) (clé de test gratuite "1"), une base crowd-sourcée gratuite dont les conditions d'utilisation autorisent explicitement à *"scraper, copier et modifier tout contenu retourné par l'API via les endpoints officiels"*, pour un usage de développement — y compris une app web tant qu'elle n'est pas publiée sur un app store. 441 cocktails uniques y sont accessibles gratuitement (recherche exhaustive par première lettre, a-z + 0-9), dont 40 sans alcool (mocktails) — c'est le plafond du niveau gratuit ; la base "complète" est réservée aux abonnés Premium (10$, usage personnel).
- **`npm run import:cocktaildb`** (`scripts/import-cocktaildb.mjs`) : récupère le catalogue, le transforme vers le schéma interne et fusionne le résultat dans `src/data/cocktails.json`, en gardant la version curatée à la main pour les 11 cocktails déjà présents dans les deux catalogues (dédoublonnage par nom). Réutilisable pour une future mise à jour du catalogue ou une nouvelle source.
- **Traduction** : les ingrédients (nom + catégorie) sont traduits en français via un dictionnaire couvrant 300 des 304 ingrédients distincts du catalogue source (99,5% des occurrences) ; les slugs sont recalés sur ceux déjà utilisés par les 14 recettes curatées quand le nom correspond exactement (ex: "Menthe fraîche" → `menthe`, pas un doublon `menthe_fraiche`), pour éviter deux entrées différentes pour le même ingrédient. Les noms de verre sont traduits de la même façon.
- **Heuristiques pour les champs absents de la source** : difficulté (déduite du nombre d'ingrédients), type de glace (déduit des instructions), garniture (déduite d'ingrédients repérés comme décoratifs), rôle de chaque ingrédient pour le moteur de matching (alcool principal/secondaire, mixer, garniture, structurant). Contrairement aux 14 recettes curatées, les 430 recettes importées n'ont ni histoire, ni conseils (`history`/`tips` à `null`) et une origine générique ("International", TheCocktailDB ne fournit pas de pays d'origine — contrairement à sa base sœur TheMealDB). Leurs étapes de préparation, initialement en anglais, ont depuis été traduites en français (voir "Internationalisation" ci-dessous).
- **Filtre par pays** : pas encore implémenté, faute de donnée source fiable — prochaine étape si une source avec origine géographique est intégrée plus tard.
- Impact mesuré : build de prod OK (le chunk de données catalogue grossit mais reste un fichier séparé, mis en cache par le service worker) ; audit Lighthouse performance sur l'accueil toujours à **97/100** (250 Kio de poids total) malgré le catalogue ×31.

## Internationalisation (FR/EN)

L'interface et le catalogue de cocktails sont disponibles en français et en anglais.

- **Choix de langue au premier lancement** (`src/components/LanguagePicker.tsx`, état persisté dans `src/state/locale.ts`) : un écran plein écran bilingue s'affiche avant tout le reste — y compris avant l'onboarding, dont le texte dépend de la langue choisie — tant qu'aucune langue n'a été sélectionnée. Un bouton dans Profil → Langue permet de basculer d'une langue à l'autre en un clic à tout moment, sans rechargement de page.
- **Chrome applicatif** (`src/domain/i18n/`) : dictionnaires `fr.ts`/`en.ts` structurellement identiques (vérifié par le typage — `en.ts` ne peut pas oublier une clé présente dans `fr.ts`), résolus via le hook `useTranslation()` (clé à point, interpolation `{{variable}}`, repli sur le français puis sur la clé brute si une traduction manque). Toutes les pages et tous les composants affichant du texte statique (labels, boutons, placeholders, messages `aria-label`) passent par ce hook.
- **Traduction du catalogue** (`src/domain/i18n/localizedCocktail.ts` + `src/data/cocktailLocaleOverrides.json`, `ingredientNames.en.json`, `cocktailFieldNames.en.json`) : le français reste la langue canonique des données (`src/data/cocktails.json`) ; l'anglais est dérivé à l'affichage via `getLocalizedCocktail()`/`useLocalizedCocktail()` sans jamais modifier les données stockées. Le français canonique couvre tous les champs des 14 recettes curatées et la plupart des 430 recettes importées (catégorie, origine, verre, type de glace, garniture, alcool principal, noms d'ingrédients — dictionnaires ou heuristiques réutilisés du pipeline d'import Sprint 10) ; seules les étapes de préparation des 430 recettes importées (à l'origine en anglais) ont nécessité une traduction dédiée vers le français. Le sens inverse (anglais) est calculé à partir de ces mêmes dictionnaires, plus une traduction dédiée de l'histoire/des conseils/des étapes des 14 recettes curatées.
- **Point d'attention pour tout nouveau code** : plusieurs fonctions du domaine (`artFor`, `gradientClassFor`, `tasteProfile`, `buildPhotoPrompt`) déterminent l'illustration/les tags/le prompt photo d'un cocktail en filtrant sur le texte français brut de `category`/`glassware`/`iceType`/`garnish` (ex: `glassware.toLowerCase().includes("chaud")`). Elles doivent donc **toujours** recevoir le cocktail canonique (non localisé), jamais le résultat de `useLocalizedCocktail()` — sans quoi l'heuristique se casse silencieusement en anglais. Seul le texte réellement affiché à l'écran doit passer par la version localisée.
- Les noms de collections (`src/data/collections.json`) et les noms de cocktails eux-mêmes ne sont pas traduits (noms propres, identiques dans les deux langues pour l'écrasante majorité du catalogue).

## Affichage responsive (Web / Tablette / Téléphone)

Jusqu'au Sprint 10, `#root` imposait `max-width: 560px` à toute l'app : un confort "mobile-first" qui devenait une colonne étroite perdue au milieu de l'écran sur tablette ou desktop. Sprint 11 introduit une vraie coquille responsive plutôt qu'un simple élargissement de ce plafond :

- **`AppShell`** (`src/App.tsx`) : sous le seuil desktop (`lg`, 1024px), comportement mobile inchangé — `TabBar` fixée en bas (`src/components/TabBar.tsx`). À partir de `lg`, une **sidebar verticale** (`src/components/SideNav.tsx`, 232px, mêmes 5 destinations que `TabBar` — liste partagée dans `src/components/navTabs.ts`) remplace la barre du bas et reste affichée en permanence, y compris sur les écrans "poussés" (fiche cocktail, formulaire de recette, partage...) qui n'ont plus de coquille propre. Seul le mode Préparation (`PreparationMode.tsx`, plein écran immersif volontairement sans navigation) reste en dehors de `AppShell`.
- **Largeur de contenu par type de page**, choisie par chaque page elle-même plutôt qu'imposée par la coquille :
  - Écrans de navigation/liste (Accueil, Bibliothèque, détail de collection, Mon Bar) : largeur progressive `560px → 720px (md) → 1100px (lg) → 1300px (xl)`, avec des grilles de `CocktailCard` qui gagnent des colonnes à chaque palier (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`).
  - Écrans de lecture/formulaire (fiche cocktail, recette partagée, partage, formulaire de recette, recherche magique, favoris, profil) : colonne de lecture fixe à `640px`, centrée — élargir ces écrans n'aide pas la lisibilité, contrairement aux grilles.
- **Bouton d'action flottant** (ex: "Préparer" en bas de la fiche cocktail) : passé de `position: fixed` (qui débordait sur la sidebar desktop et se superposait à la `TabBar` sur mobile/tablette) à `position: sticky` en fin de page — reste visible pendant le défilement tout en respectant naturellement les bornes de son conteneur scrollable (`<main>`), donc sans jamais chevaucher la `TabBar`, qui est un frère du `<main>` et non un enfant.
- `src/components/CocktailCard.tsx` utilisé sans prop `width` dans un carrousel `flex` (accueil) recevait une largeur incohérente d'une carte à l'autre selon le contenu voisin (artefact `flex-shrink` implicite) — corrigé en fixant `width={152}`, plus visible qu'avant maintenant que davantage de cartes tiennent à l'écran.
- Tests dédiés : `e2e/responsive.spec.ts` (sidebar visible/masquée selon le seuil, navigation persistante, non-chevauchement du bouton d'action avec la `TabBar`) + vérification visuelle manuelle à 390px/820px/1440px.

## Engagement & fidélisation (Sprint 12)

Quatre mécaniques additives, toutes dérivées des données déjà stockées localement (historique, favoris, Mon Bar) — aucune n'introduit de compte, de backend ni de vraies notifications push (l'app reste 100% localStorage, voir § Limites connues).

- **Badges** (`src/domain/achievements.ts`) : 10 badges (première préparation, séries de préparation, exploration d'alcools différents, favoris, bar bien garni, recette perso créée, défi de la semaine relevé...) calculés à la volée à partir des stores existants (`useAchievements`, `src/hooks/useAchievements.ts`) — aucun état dédié à persister pour le déverrouillage lui-même. Seul `cocktailai:achievements-seen` (`src/state/achievements.ts`) est stocké, pour savoir quels badges ont déjà été annoncés et afficher un toast (`AchievementToast.tsx`, monté au niveau `App`, visible même hors `AppShell`) uniquement à l'instant du déverrouillage. Les badges de série utilisent la série la plus longue jamais atteinte (`longestStreakDays`), jamais la série en cours : un badge acquis ne doit jamais se "reperdre".
- **Défi de la semaine** (`src/domain/weeklyChallenge.ts`) : un cocktail imposé, identique pour tout le monde, choisi par hachage déterministe de la semaine (même principe que `dailyPick`, voir § Affichage responsive). Aucun stockage dédié : la réussite passée est retrouvée rétroactivement en rejouant la fonction de sélection sur la date de chaque entrée d'historique.
- **Suggestions "presque prêt"** (`src/hooks/useAlmostReadyMatches.ts`) : sous-ensemble des correspondances `computeAdvancedMatches` à exactement 1 ingrédient manquant — pastille sur l'onglet Mon Bar (`NavBadgeDot`, dans `TabBar`/`SideNav`) et bannière d'accueil dismissible 24h (`AlmostReadyBanner.tsx`, état dans `src/state/dismissedNudges.ts`). Pas de vraie notification push : cela demanderait un serveur (VAPID/Web Push), hors de portée d'une app 100% locale — le signal reste dans l'app, visible à la prochaine ouverture.
- **Recommandations expliquées** (`explainRecommendation` dans `src/domain/recommendation.ts`) : la section "Recommandés pour toi" affiche désormais la raison de chaque suggestion (alcool principal partagé en priorité, sinon tag de goût le mieux représenté) sous forme de légende sur la carte (`CocktailCard` prop `caption`), à la place des tags de goût habituels pour ne pas surcharger la carte.

## Contenu éditorial & découverte approfondie (Sprint 13)

- **Collection "Cocktails d'exception"** (`src/data/collections.json`, `src/data/notableCreators.json`, `src/domain/notableCreators.ts`) : 11 classiques réels du catalogue (Sazerac, Bramble, Espresso Martini, Old Cuban, Penicillin, Zombie...) enrichis d'une histoire précise et d'une attribution factuelle (créateur, année, lieu — ex: Dick Bradsell pour le Bramble et l'Espresso Martini à Londres, Sam Ross pour le Penicillin à New York). L'attribution s'affiche en légende de carte dans la collection (`CollectionDetail.tsx`, via la prop `caption` de `CocktailCard`) et en ligne dédiée sur la fiche cocktail (`CocktailDetail.tsx`, juste avant l'historique).
- **Défi du mois** (`src/domain/monthlyChallenge.ts`, `MonthlyChallengeCard.tsx`) : même principe déterministe que le défi de la semaine, mais en deux temps — un thème est d'abord tiré parmi 4 (Tiki, Sans alcool, Spiritueux corsés, Fruités, définis par `category`/`tasteProfile` déjà présents dans le catalogue, pas de méta-donnée à maintenir), puis un cocktail dans le sous-ensemble qui correspond. Affiché sous le défi de la semaine sur l'accueil.
- **Recettes signature** (`src/domain/signatureRecipe.ts`) : une recette perso préparée au moins 3 fois par son créateur (le seul utilisateur possible, app 100% locale) devient "signature" — pastille étincelante sur sa carte (`CocktailCard`) et ligne dédiée sur sa fiche (`CocktailDetail.tsx`), sans nouvel état à stocker (dérivé de l'historique existant).
- Trois nouveaux badges tirent parti de ce contenu : `connoisseur` (3 cocktails de la collection préparés), `monthlyChallenger` (défi du mois relevé), `signatureCreator` (une recette perso devient signature) — même mécanique rétroactive sans état dédié que les badges du Sprint 12.

## Notes personnelles

- **Ma note** (`src/state/cocktailNotes.ts`, section dédiée sur `CocktailDetail.tsx`) : un champ libre par cocktail, privé à l'appareil (`cocktailai:cocktail-notes` en localStorage, aucune synchronisation ni partage — cohérent avec le reste de l'app, voir § Limites connues). Sauvegarde au blur (comme la quantité approximative dans Mon Bar) ; une note vidée est supprimée du store plutôt que stockée vide.

## Partage social boosté (Sprint 5 croissance)

- **`ShareCardModal`** (`src/components/ShareCardModal.tsx`) : carte de partage générique (canvas → PNG, Web Share API avec fallback téléchargement, même principe que la carte cocktail de `Share.tsx` — `wrapText` a été extrait dans `src/domain/canvasText.ts` pour être partagé entre les deux) pour du contenu qui n'est pas un cocktail précis : emoji, titre, sous-titre, branding Cocktail.ai.
- Trois nouveaux points d'entrée de partage, tous sans backend (le contenu du visuel suffit à raconter l'accomplissement, pas besoin de lien vers une page vivante) :
  - **Badge débloqué** : bouton de partage sur le toast de déblocage (`AchievementToast.tsx`) et sur chaque badge débloqué dans la grille du Profil (`Profile.tsx`) — partage à l'instant du déblocage ou rétroactivement depuis le Profil.
  - **Défi de la semaine / du mois relevé** : bouton de partage à côté du badge "Réussi" sur `WeeklyChallengeCard.tsx`/`MonthlyChallengeCard.tsx` une fois le défi complété.

## Nouvelles fonctionnalités & monétisation sans backend

Suite à la question "comment monétiser et générer plus de valeur" : cinq nouvelles fonctionnalités et trois mécanismes de monétisation, tous réalisables sans compte ni serveur (cohérent avec l'architecture 100% locale de l'app). Ce qui demande un vrai backend (comptes, abonnement, sync) reste dans la todo en fin de section.

- **Mode Soirée** (`src/domain/partyPlanner.ts`, `src/pages/PartyPlanner.tsx`, route `/party`) : sélection de plusieurs cocktails + nombre d'invités, quantités additionnées (par ingrédient et unité — des unités différentes pour un même ingrédient restent des lignes séparées plutôt que d'être converties) et ajoutables en un clic à la liste de courses. Point d'entrée depuis Mon Bar.
- **Achat malin** (`src/domain/nextBestBottle.ts`, section dans `MyBar.tsx`) : parmi les cocktails à 1 ingrédient manquant, quel ingrédient reviendrait le plus souvent ? L'acheter débloque plusieurs cocktails d'un coup. N'affiche que les ingrédients qui débloquent au moins 2 cocktails (en dessous, la section "Presque prêt" suffit déjà) et masque un ingrédient déjà ajouté à la liste de courses pour éviter de le suggérer deux fois sur le même écran.
- **Collections saisonnières** (`src/domain/seasonalCollections.ts`, section sur `Home.tsx`) : Cocktails d'été (catégories Tropical/Tiki, 15 cocktails) ou Cocktails d'hiver (famille whisky/cognac/brandy, 61 cocktails) affichés automatiquement selon le mois en cours — mêmes critères vérifiés sur le catalogue que le défi du mois (Sprint 13).
- **Accord mets-cocktail** (`src/domain/foodPairing.ts`, ligne dédiée sur `CocktailDetail.tsx`) : suggestion d'accord dérivée du même profil de goût que `tasteProfile.ts` (le tag prioritaire décide), pas de nouveau champ de données.
- **Personnalisation cosmétique** (`src/domain/cosmetics.ts`, `src/state/cosmetics.ts`, section Profil) : 4 skins de couleur d'accent (Or, Émeraude, Rubis, Améthyste) débloqués par nombre de badges — mécanique d'engagement à la jeu vidéo, appliquée via `[data-skin]` en CSS (`index.css`), même cascade que le thème clair/sombre.

Monétisation :

- **Liens d'affiliation** (`src/domain/affiliateLinks.ts`, bouton sac de courses sur les cartes "Achat malin") : pointent aujourd'hui vers une recherche shopping générique (aucun programme d'affiliation réel branché) — le point d'entrée UI est prêt, il suffit de remplacer `buildBuyLinkUrl` par un lien vers un partenaire réel avec son identifiant de tracking pour monétiser.
- **Sponsoring de collection** (`CollectionDef.sponsor` optionnel, affichage "Présenté par" sur `CollectionDetail.tsx`) : mécanisme inactif par défaut, prêt à s'activer en renseignant `sponsor` dans `collections.json` le jour où un partenariat éditorial existe.
- **Soutenir Cocktail.ai** (`src/domain/supportLink.ts`, section Profil) : écran de soutien masqué tant que `SUPPORT_URL` vaut `null` — s'active en y renseignant un vrai lien de paiement (Stripe Payment Link), sans autre changement de code.

## Outils Pro pour les bars (B2B, sans backend)

Deux outils professionnels, accessibles depuis Profil > Outils Pro. Les fiches techniques (recettes perso) existaient déjà (RecipeForm) — la nouveauté est le calcul de coût et la diffusion publique d'une sélection.

- **Calcul de rentabilité** (`src/domain/costing.ts`, `src/state/ingredientCosts.ts`, `src/pages/Costing.tsx`, route `/costing`) : coût matière par cocktail à partir du prix d'achat de chaque bouteille (saisi localement, persistant), et prix de vente suggéré à plusieurs marges cibles (20/25/30%). Seuls les ingrédients dosés dans une unité volumique non ambiguë sont costés — cl, ml, oz (once fluide US), cc/cs (cuillère à café/soupe) ; oz est même l'unité la plus fréquente du catalogue (583 lignes contre 151 pour cl), sans cette conversion l'outil aurait été inutilisable sur la majorité des recettes. "mesure"/"shot"/"trait" restent volontairement non costés (contenance réelle trop variable pour un chiffre honnête).
- **Créateur de carte + QR code** (`src/domain/menuShareCode.ts`, `src/pages/MenuBuilder.tsx` route `/menu-builder`, `src/pages/MenuView.tsx` route `/menu/:code`) : sélection de cocktails du catalogue + prix optionnel, encodés dans un lien auto-porteur (même principe que `recipeShareCode.ts`, base64 extrait dans `src/domain/base64Url.ts` pour être partagé entre les deux) et un QR code. Uniquement des cocktails du catalogue (jamais une recette perso) : c'est ce qui rend le lien résoluble sur n'importe quel appareil qui scanne le QR code, sans backend. La carte publique (`MenuView.tsx`) réutilise `CocktailVisual` (photo réaliste si `public/images/cocktails/` en a une pour ce cocktail, sinon illustration de verre de marque — jamais d'image cassée), avec tags de goût et liste d'ingrédients. Bouton impression (`window.print()`, pas d'export PDF dédié) — voir plus bas pour le rendu papier dédié.
  - **Mises en page** (`MenuPayload.layout`, choisie dans `MenuBuilder.tsx`, rendue dans `MenuView.tsx`) : `list`/`grid2`/`grid3` (une page, 1/2/3 colonnes, cartes pleines pour `list`/`grid2`, cartes compactes sans ingrédients pour `grid3`), `pages` (pagination écran avec `itemsPerPage` réglable — 1 = une page par cocktail, cartes pleines ; sinon grille compacte de 2 ou 3 colonnes selon le nombre par page), `featured` (les cocktails marqués d'une étoile dans le builder s'affichent en grande carte, le reste en grille compacte 3 colonnes). Un lien généré avant l'ajout des mises en page reste décodable (repli sur `list`, voir `decodeMenu`). À l'impression, `pages` imprime toutes les pages avec saut de page entre chacune (CSS `@media print` dans `index.css`) plutôt que de n'imprimer que la page actuellement affichée à l'écran.
  - **Carte "livret" premium** (logo, histoire, couvertures de fin) : dès qu'un logo est ajouté dans `MenuBuilder.tsx`, la carte devient un livret paginé avec, dans l'ordre, une page de couverture (fond dégradé du thème, logo sur fond blanc, nom de l'établissement), une page "Notre histoire" optionnelle (texte saisi ou importé depuis un `.txt`, et/ou image), les pages de cocktails (selon la mise en page choisie), puis systématiquement deux pages de fin : logo sur fond blanc, puis nom + logo sur fond noir avec effet "argent" (dégradé CSS `background-clip: text`, pas de retouche du logo lui-même). Sans logo, la carte reste sur une seule page comme avant (aucun changement de comportement pour les liens déjà générés). Navigation par page unique (`MenuView.tsx`, précédent/suivant), toutes les pages s'impriment avec saut de page (même mécanisme `@media print` que `pages` ci-dessus).
  - **Thèmes** (`src/domain/menuThemes.ts`) : `classic` (neutre), `instagram` (dégradé rose/orange), `apple` (fond clair, typographie sobre) — appliqués à la couverture et à la page histoire.
  - **Logo et image d'histoire compressés côté client** (`src/domain/imageCompression.ts`) : redimensionnement + réencodage JPEG via `<canvas>` avant intégration dans le lien (logo 100px/qualité 0.55, image d'histoire 220px/qualité 0.5) — nécessaire car tout le contenu de la carte, y compris les images, est encodé directement dans l'URL (pas de stockage serveur).
  - **Contrainte de taille du QR code** : mesure empirique (données base64url réalistes, pas des caractères répétés qui biaisent la détection de mode du QR) donnant un plafond réel d'environ 2280 caractères pour l'URL complète. `MenuBuilder.tsx` affiche un indicateur de taille en direct pendant la composition de la carte et, au-delà de 2000 caractères de code (marge de sécurité), n'essaie plus de générer de QR code — le lien reste pleinement fonctionnel (copie, aperçu, partage), seul le QR visuel est omis plutôt que de produire un code illisible.
  - **Rendu papier dédié** (`PrintBooklet` et les composants `Print*` dans `MenuView.tsx`, CSS dans `src/index.css`) : l'impression ne réutilise pas la mise en page écran (pensée pour naviguer au doigt) — c'est un second rendu complet, typographie de vraie carte de bar (nom/prix reliés par un pointillé, ingrédients en petites capitales italiques, séparateurs élégants), généré uniquement au moment de l'impression et invisible à l'écran (classe `.print-booklet`, `display:none` hors `@media print`). Format papier choisi dans `MenuBuilder.tsx` (`MenuPayload.printFormat`, A5 par défaut — carnet de bar classique — ou A4), traduit en dimensions physiques exactes via une règle `@page` générée dynamiquement. Couverture/histoire/dos gardent une hauteur de feuillet fixe ; la liste des cocktails n'a volontairement pas de hauteur fixée et s'étale sur autant de feuillets que nécessaire — c'est la pagination native du navigateur (`break-after: page` + `break-inside: avoid` sur chaque cocktail) qui la découpe, jamais un calcul manuel du nombre de cocktails par page. Trois pièges rencontrés en vérifiant le PDF réellement généré (pas seulement l'aperçu écran) : `@page` imbriqué dans `@media print` n'est pas fiable pour la taille physique du feuillet (déclaré hors de tout `@media` à la place) ; un contenu plus grand qu'un feuillet à l'intérieur de `<main class="overflow-y-auto">` (AppShell) se fait tronquer par le pipeline d'impression de Chromium — le rendu papier est donc porté (`createPortal`) directement sous `<body>`, hors de cet ancêtre scrollable ; des éléments `position: fixed` normalement hors-écran (`SkipLink`, et `#root` lui-même via son `min-height: 100svh`) génèrent chacun un feuillet fantôme vide à l'impression s'ils ne sont pas explicitement masqués (`.skip-link`, `#root { display: none }` sous `@media print`).

### Todo "avec backend" (mise de côté pour plus tard)

- **Sprint 4 — vrai fil communautaire** : comptes, publications, likes/commentaires. Demande une infra serveur complète (auth, base de données, modération), hors de portée de l'architecture 100% locale actuelle.
- **Génération de recette par IA** ("invente-moi un cocktail avec ce que j'ai") : nécessite un appel serveur (une clé API ne peut pas être exposée côté client en toute sécurité).
- **Abonnement freemium** (comptes + Stripe Subscriptions, sync multi-appareils, contenu exclusif) : le modèle de monétisation à plus fort revenu récurrent, mais suppose le chantier compte/backend ci-dessus déjà construit. C'est aussi la seule façon honnête de faire payer les fonctionnalités déjà gratuites (Mon Bar, Mode Soirée…) : sans compte, un paywall client-only se contourne en vidant le cache.
- **Espace pro multi-employés** (fiches techniques partagées entre plusieurs comptes d'un même établissement, formation des nouveaux employés) : demande un vrai espace partagé (plusieurs personnes, un seul bar), donc un compte — les fiches perso actuelles (RecipeForm) restent mono-appareil.

## Limites connues

- Comme documenté dans le README iOS pour la V1, deux noms d'ingrédients personnalisés produisant le même slug (accents) entreraient en conflit.
- Les noms des collections (`src/data/collections.json`) restent affichés en français même en mode anglais.
