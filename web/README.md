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

## Déployer

Le build produit un site 100% statique (`dist/`). Trois options, toutes gratuites pour ce type de projet :

### Vercel (recommandé)
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
- Les **14 cocktails, 7 collections et 6 substitutions** du seed iOS sont repris tels quels (`src/data/*.json`, copiés depuis `Resources/SeedData/`).

Le moteur de matching (`src/domain/matchingEngine.ts`) est un **portage ligne à ligne** de `Services/MatchingEngine.swift` : mêmes poids par rôle (alcool principal 1.0, secondaire 0.8, structurant 0.6, mixer 0.35, garniture 0.15), mêmes règles de dégradation de stock (1.0 / 0.75 / 0.4), même seuil d'exclusion (2 ingrédients manquants max), V1 et V2 strictement séparés comme dans le code Swift.

## Différences assumées par rapport à l'app iOS

- **Pas de compte ni de synchronisation multi-appareil.** L'app iOS synchronise Mon Bar/Favoris/Historique via CloudKit ; ici tout est stocké dans le `localStorage` du navigateur (documenté à l'utilisateur dans l'écran Profil). C'est la limitation structurelle attendue d'une version web sans backend — un vrai compte nécessiterait une API et une base de données.
- **Deep linking natif, pas un schéma d'URL custom.** Là où l'app iOS a dû construire tout un système `cocktailapp://` (Sprint 12), le web a l'avantage d'avoir des URLs directement partageables (`/cocktail/mojito`) — aucune configuration supplémentaire n'est nécessaire.
- **Pas de widget d'écran d'accueil ni de notifications push** — équivalents natifs sans équivalent web direct pris en charge ici.
- **Icônes** : emoji plutôt que SF Symbols/illustrations dédiées (aucun asset graphique livré avec le projet iOS au-delà de l'icône d'app).
- **Recommandations "Populaires" / "Recommandés"** : mêmes heuristiques simples que l'app iOS (classiques d'abord, tri par difficulté), en attendant un vrai moteur de recommandation — assumé de la même façon que dans le README iOS.

## Structure du code

```
src/
  data/            JSON du seed (copié depuis Resources/SeedData de l'app iOS)
  domain/          Types, moteur de matching V1/V2, formatage, dégradés, catalogue
  state/           Stores Zustand persistés (favoris, Mon Bar, historique, recettes perso, thème)
  components/      UI partagée (CompatibilityRing, CocktailCard, IngredientChip, TabBar...)
  pages/           Un fichier par écran, routés dans App.tsx
```

## Limites connues

- Pas de tests automatisés portés (les tests Swift ne sont pas transposables tels quels) — validation faite manuellement en local (build + parcours utilisateur dans un navigateur).
- Le partage visuel ne propose que 3 formats (Story/Post/Pinterest) contre 5 côté iOS (TikTok/Snapchat omis, mêmes ratios que Story/Post).
- Comme documenté dans le README iOS pour la V1, deux noms d'ingrédients personnalisés produisant le même slug (accents) entreraient en conflit.
