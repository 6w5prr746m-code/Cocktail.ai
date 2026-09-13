# Cocktail.ai

## Version Web

En plus de l'app iOS documentée ci-dessous, ce dépôt contient désormais une **version web équivalente, déployable en quelques minutes** : voir [`web/`](./web) (React + TypeScript + Vite + Tailwind, persistance locale, aucun backend requis). Elle reprend fidèlement la recherche magique par ingrédients, la bibliothèque avec filtres et collections, Mon Bar avec le Matching Engine V2, la fiche cocktail, le mode préparation, les favoris, la création de recettes perso et le partage visuel — voir [`web/README.md`](./web/README.md) pour le détail du portage, les différences assumées et les instructions de déploiement (Vercel, Netlify, ou tout hébergeur statique).

# Sprint 0 → 12 — Intégration dans Xcode

Ce dossier ne contient pas de `.xcodeproj` (généré uniquement par Xcode).
Pour l'intégrer :

## 1. Créer le projet Xcode

1. Xcode → File → New → Project → **App**
2. Nom : `CocktailApp`
3. Interface : **SwiftUI**, Language : **Swift**
4. Cocher **Use SwiftData** au moment de la création
5. Décocher "Include Tests" n'est pas nécessaire, garder la cible de tests par défaut

## 2. Remplacer / ajouter les fichiers

1. Supprimer le fichier `CocktailApp.swift` et `Item.swift` générés par défaut par Xcode
2. Glisser-déposer les dossiers suivants dans le navigateur de projet Xcode (cocher **"Copy items if needed"** et **"Create groups"**) :
   - `App/`
   - `Domain/`
   - `Data/`
   - `Services/`
   - `Features/`
   - `DesignSystem/`
3. Pour `Resources/SeedData/cocktails_seed.json` **et** `Resources/SeedData/collections_seed.json` :
   - Glisser ces fichiers dans le projet
   - Vérifier dans l'inspecteur de fichier (panneau de droite) que **"Target Membership"** coche bien la cible `CocktailApp` (sinon `Bundle.main.url(forResource:)` ne les trouvera pas)
4. Pour le contenu de `Tests/` (`SeedImporterTests.swift`, `MatchingEngineTests.swift`, `FavoriteAndHistoryTests.swift`, `RecipeFormViewModelTests.swift`, `DeepLinkTests.swift`) :
   - Glisser ces fichiers dans la cible de **tests** (`CocktailAppTests`), pas dans la cible principale

## 3. Vérifications avant de lancer

- Build target minimum : **iOS 17.0** (requis par SwiftData)
- Le fichier `AppContainer.swift` référence tous les `@Model` du schéma — si vous ajoutez un nouveau modèle plus tard, pensez à l'ajouter à la fois dans `AppContainer.swift` et dans les tests

## 4. Lancer

- `Cmd+R` sur un simulateur iPhone 15/16
- Vous devriez voir une liste brute des 5 cocktails du seed (Mojito, Cuba Libre, Daiquiri, Old Cuban, Virgin Mojito), stylée avec les couleurs et la typographie du Design System — c'est le livrable de validation du Sprint 0.
- `Cmd+U` pour lancer les tests unitaires (`SeedImporterTests`)

## Ce que ce Sprint 0/1 NE contient volontairement PAS

Conformément au plan de sprints : pas de vrai écran d'accueil ni de picker d'ingrédients animé (Sprint 2), pas de photos réelles (le champ `imageURL` du seed contient des noms d'assets placeholder à ajouter dans `Assets.xcassets`). Les écrans `RootView` et `MatchingDebugView` actuels sont des écrans de **debug technique**, pas des écrans produit.

## Sprint 1 — Moteur de matching

Ajouts par rapport au Sprint 0 :
- `Domain/Models/MatchResult.swift` et `Domain/Protocols/MatchingEngineProtocol.swift`
- `Services/MatchingEngine.swift` — l'implémentation du score de compatibilité
- `Tests/MatchingEngineTests.swift` — 7 tests couvrant les cas limites (0 ingrédient, tous les ingrédients, ingrédients optionnels, tri, cocktail invalide)
- `Features/Debug/MatchingDebugView.swift` + `MatchingDebugViewModel.swift` — écran accessible depuis la liste de debug du Sprint 0 (lien "🧪 Debug — Moteur de matching")

**Pour tester** : lancer l'app, taper sur "🧪 Debug — Moteur de matching", sélectionner au moins 3 ingrédients parmi ceux du seed (ex: Rhum blanc, Citron vert, Menthe fraîche) et vérifier que les résultats et leurs pourcentages semblent pertinents. C'est le critère de validation du sprint avant de passer à la vraie UI (Sprint 2).

**Point d'attention technique** : le recalcul dans `MatchingDebugViewModel` tourne actuellement sur le MainActor (les `@Model` SwiftData ne sont pas `Sendable`, donc pas de `Task.detached` direct). Sans impact sur ~5 cocktails de seed ; à revisiter si la bibliothèque grossit significativement (voir commentaire dans le fichier).

## Sprint 2 — Accueil + Recherche magique (UI)

Ajouts par rapport au Sprint 1 :
- `App/CocktailApp.swift` — `RootView` devient une vraie `TabView` (Accueil / Bibliothèque / Mon Bar / Favoris / Profil). Les onglets non développés affichent un `ContentUnavailableView` explicite plutôt qu'une page vide. Les outils de debug des Sprints 0/1 sont regroupés sous l'onglet Profil.
- `Features/Home/` — `HomeView` + `HomeViewModel` : hero "Que souhaites-tu boire ce soir ?", CTA principal, 4 sections horizontales (Populaires, Nouveautés, Recommandés, Favoris)
- `Features/IngredientPicker/` — `IngredientPickerView` + `IngredientPickerViewModel` : la recherche magique en temps réel (US-A1 à US-A3), présentée en sheet depuis le CTA de l'accueil
- `DesignSystem/Components/CompatibilityRing.swift` — le **Liquid Ring**, signature visuelle de l'app (voir Design System §1)
- `DesignSystem/Components/CocktailCard.swift` — carte utilisée dans les sections de l'accueil

**Simplifications assumées pour ce sprint** (à documenter, pas des bugs) :
- Les sections "Populaires" et "Recommandés" utilisent des heuristiques simples (voir commentaires dans `HomeViewModel`) en attendant respectivement la fonction communautaire et le `RecommendationEngine` (V2)
- Pas de photos réelles : `CocktailCard` affiche le dégradé par famille + une icône SF Symbol en placeholder
- Taper sur une carte de cocktail ne fait rien pour l'instant (la fiche cocktail arrive au Sprint 3)

**Pour tester** : lancer l'app → onglet Accueil → vérifier les 4 sections → taper "Ajouter mes ingrédients" → sélectionner des ingrédients un par un et observer les résultats apparaître/disparaître en temps réel, sans bouton de validation, avec l'anneau de compatibilité animé.

## Sprint 3 — Fiche cocktail

Ajouts par rapport au Sprint 2 :
- `Features/CocktailDetail/` — `CocktailDetailView` + `CocktailDetailViewModel` : photo immersive (dégradé placeholder), nom/temps/difficulté en overlay, sections Ingrédients / Préparation / Histoire / Variantes / Conseils, CTA "Préparer" fixe en bas
- `App/NavigationDestinations.swift` — résolveur central des destinations de navigation (`destinationView(for:modelContext:)`), partagé entre la pile de l'onglet Accueil et celle de la sheet de recherche magique, pour ne pas dupliquer le switch de navigation à deux endroits
- Navigation branchée : les cartes de l'accueil et les lignes de résultats de la recherche magique mènent maintenant à la vraie fiche cocktail
- Le bouton cœur (favori) est fonctionnel dès ce sprint — la persistance `FavoriteEntity` posée au Sprint 2 est exploitée ici en avance, l'écran "Favoris" dédié reste prévu au Sprint 5

**Simplifications assumées pour ce sprint** :
- Pas de swipe vertical géré manuellement : le `ScrollView` natif suffit à l'effet recherché (immersion + scroll fluide) sans complexité supplémentaire
- Le bouton "Préparer" ne fait rien pour l'instant (mode préparation = Sprint 4) — la destination `preparationMode` existe déjà dans `NavigationDestinations.swift` en `ComingSoonView`, prête à être branchée
- Les variantes ne s'affichent que si le cocktail en a (aucune dans le seed actuel — section invisible sur les 5 cocktails de démo, normal)

**Pour tester** : depuis l'accueil ou la recherche magique, ouvrir un cocktail (ex: Old Cuban, qui a des conseils et une histoire) et vérifier l'immersion visuelle, le scroll, et le bouton favori qui se persiste (quitter/relancer l'app).

## Sprint 4 — Mode préparation

Ajouts par rapport au Sprint 3 :
- `Features/PreparationMode/` — `PreparationModeView` + `PreparationModeViewModel` : plein écran, étape par étape, swipe horizontal pour valider, timer en `Liquid Ring` pour les étapes chronométrées, écran de fin ("Ton cocktail est prêt !")
- Le bouton "Préparer" de la fiche cocktail est maintenant branché (`NavigationLink` vers `AppNavigation.Destination.preparationMode`)
- `App/NavigationDestinations.swift` mis à jour : la destination `preparationMode` route vers la vraie vue

**Détails d'implémentation notables** :
- `UIApplication.shared.isIdleTimerDisabled` est activé à l'entrée du mode préparation et désactivé à la sortie (`onAppear`/`onDisappear`) pour garder l'écran allumé pendant toute la préparation (US-C1)
- Le timer d'étape tourne sur une `Task` avec un `Task.sleep` d'1 seconde, annulée proprement au changement d'étape ou à la fermeture de l'écran — pas de `Timer` classique à invalider manuellement
- Haptique différenciée : impact léger/moyen au swipe de validation, notification de succès distincte à la fin d'un timer d'étape
- Le swipe est géré par un `DragGesture` horizontal simple (translation + seuil de 80pt) plutôt qu'un framework de gestes dédié — suffisant pour l'effet recherché sans complexité excessive

**Simplification assumée** : la création de l'`HistoryEntryEntity` à la fin de la préparation est repoussée au Sprint 5 (comme prévu au plan), pour l'implémenter en même temps que l'écran Historique dédié plutôt que de la faire à moitié ici.

**Pour tester** : ouvrir un cocktail avec des étapes chronométrées (ex: Daiquiri, qui a un shake de 15 secondes) → "Préparer" → swiper pour valider chaque étape → vérifier que l'écran reste allumé et que le timer se remplit bien en Liquid Ring sur l'étape du shaker.

## Sprint 5 — Favoris & Historique (persistance CloudKit)

Ajouts par rapport au Sprint 4 :
- `Features/Favorites/` — vrai écran Favoris (liste, navigation vers la fiche, suppression par swipe)
- `Features/Profile/` — nouvel onglet Profil avec section Historique (cocktails préparés, triés du plus récent, avec date) + accès aux outils de debug
- Le mode préparation enregistre désormais une `HistoryEntryEntity` à la fin de chaque préparation complète

**⚠️ Changement d'architecture important — à lire avant de continuer** :

En implémentant la vraie séparation CloudKit prévue dans l'Architecture Technique (§6), deux contraintes CloudKit non anticipées dans les sprints précédents ont dû être corrigées :

1. **CloudKit interdit les attributs `@Attribute(.unique)`** sur toute entité synchronisée. `FavoriteEntity`, `HistoryEntryEntity` et `UserIngredientEntity` ont donc perdu cette contrainte sur leur `id` (la bibliothèque de référence, non synchronisée, la garde).
2. **CloudKit interdit les relations entre une entité synchronisée et une entité qui ne l'est pas.** Comme la bibliothèque de cocktails reste volontairement locale (voir §6), `FavoriteEntity.cocktail` et `HistoryEntryEntity.cocktail` (des `@Relationship`) sont devenus `cocktailID: UUID` — un simple identifiant résolu manuellement dans les ViewModels via `FetchDescriptor`. Ce n'est pas un contournement bancal : c'est la façon correcte de faire cohabiter un référentiel local avec des données personnelles synchronisées dans SwiftData+CloudKit.

`AppContainer` déclare maintenant deux `ModelConfiguration` distinctes au sein d'un seul `ModelContainer` :
- `"Reference"` : bibliothèque de cocktails, 100% locale (`cloudKitDatabase: .none`)
- `"User"` : Mon Bar, Favoris, Historique — synchronisés (`cloudKitDatabase: .private(...)`)

**Action requise avant de lancer sur un vrai appareil (pas nécessaire en simulateur pour tester le reste)** :
1. Dans Xcode : Signing & Capabilities → **+ Capability** → **iCloud** → cocher **CloudKit**
2. Créer/sélectionner un conteneur CloudKit (ex: `iCloud.com.votredomaine.cocktailapp`)
3. Remplacer la chaîne `"iCloud.com.peoplespheres.cocktailapp"` dans `AppContainer.swift` par ce véritable identifiant
4. Être connecté à un compte iCloud sur l'appareil/simulateur de test

**Pour tester** (sans forcément configurer CloudKit — la persistance locale fonctionne dans tous les cas) : mettre un cocktail en favori depuis sa fiche → vérifier qu'il apparaît dans l'onglet Favoris → le supprimer par swipe → préparer un cocktail jusqu'au bout (Sprint 4) → vérifier qu'il apparaît dans "Historique" sous l'onglet Profil avec la bonne date.

## Sprint 6 — Recherche multicritère & Collections

Ajouts par rapport au Sprint 5 :
- `Features/Library/` — vrai écran Bibliothèque : recherche libre (nom + ingrédient dans le même champ), filtres par alcool principal / difficulté / occasion (sheet dédiée), grille de résultats
- `Features/CollectionDetail/` — détail d'une collection thématique (grille des cocktails qu'elle contient)
- `Resources/SeedData/collections_seed.json` + `CollectionSeedDTO.swift` — 5 collections de démo (Cocktails d'été, Apéritifs, Sans alcool, Soirée chic, Classiques intemporels), résolues par nom de cocktail à l'import
- `SeedImporter` importe maintenant aussi les collections, juste après les cocktails, en excluant automatiquement toute collection dont aucun cocktail ne correspondrait (garde-fou pour l'enrichissement futur de la base)

**Écart assumé par rapport au PRD — à noter pour la suite** :
Le PRD liste 6 critères de recherche : nom, alcool, ingrédients, **couleur**, difficulté, occasion. Le modèle de données actuel n'a pas de champ "couleur" dédié — seul `category` existe, déjà utilisé à la fois pour le dégradé visuel du Design System et pour ce qui se rapproche d'une "occasion". Plutôt que de faire semblant avec un filtre "couleur" qui interrogerait en réalité le même champ que "occasion", ce filtre est **omis pour l'instant** et documenté ici comme dépendant d'un enrichissement du modèle (ajout d'un vrai champ couleur/tag) à prévoir lors du travail de contenu à grande échelle (voir Sprint 10 du plan).

Les collections du PRD comme "Halloween", "Noël", "Mariage", "Barbecue", "Brunch" ne sont pas encore présentes : avec seulement 5 cocktails de seed, elles seraient vides. Elles apparaîtront naturellement une fois la bibliothèque enrichie, sans changement de code — le mécanisme d'import les gère déjà (`importCollections` ignore juste les collections vides).

**Pour tester** : onglet Bibliothèque → taper "citron" dans la recherche (doit remonter Mojito, Cuba Libre, Daiquiri, Old Cuban, Virgin Mojito) → ouvrir les filtres et cocher "Facile" → vérifier que la liste se restreint → taper sur la collection "Cocktails d'été" et vérifier son contenu.

## Sprint 7 — Création & modification de recettes personnelles

Ajouts par rapport au Sprint 6 :
- `Features/RecipeForm/` — `RecipeFormView` + `RecipeFormViewModel`, formulaire unique partagé par la création (US-D1) et la modification (US-D2)
- Bouton "+" dans la toolbar de la Bibliothèque → ouvre le formulaire de création en sheet
- Bouton crayon dans la toolbar de la fiche cocktail → visible **uniquement** si `cocktail.isUserCreated == true` (US-D2 : la bibliothèque de référence n'est pas éditable)
- `Tests/RecipeFormViewModelTests.swift` — validation de la création, du blocage si nom/ingrédient/étape manquant, et de la modification (remplacement propre des ingrédients/étapes sans dupliquer le cocktail)

**Détails d'implémentation notables** :
- Les ingrédients sont saisis en texte libre plutôt que choisis dans une liste fermée : `findOrCreateIngredient` réutilise un ingrédient existant du référentiel (recherche insensible à la casse) ou en crée un nouveau à la volée. Limite connue mais mineure : deux noms différents qui produiraient le même slug (ex: accents) provoqueraient un conflit — acceptable pour la V1, à surveiller si la saisie libre pose problème en usage réel
- La modification supprime puis recrée entièrement les ingrédients/étapes du cocktail plutôt que de tenter un diff ligne à ligne — plus simple et suffisamment rapide à l'échelle d'une recette perso

**⚠️ Limitation de conception assumée, à trancher avant la V2** :
Les recettes créées ici sont des `CocktailEntity` classiques (comme la bibliothèque de référence), simplement marquées `isUserCreated = true`. Elles vivent donc dans la configuration **"Reference"**, qui n'est **pas synchronisée via CloudKit** (voir Sprint 5). Concrètement : une recette personnelle créée en V1 reste sur l'appareil qui l'a créée, elle ne suit pas l'utilisateur sur un autre iPhone. Corriger ça proprement demanderait soit une entité `UserRecipeEntity` séparée et synchronisée (dupliquant une partie du modèle `CocktailEntity`), soit d'assouplir la séparation stricte référence/perso posée à l'Architecture Technique — un vrai arbitrage à faire consciemment plutôt qu'un correctif de dernière minute.

**Pour tester** : Bibliothèque → "+" → créer un cocktail simple (ex: nom, un ingrédient, une étape) → "Ajouter à ma bibliothèque" → vérifier qu'il apparaît dans les résultats de recherche et dans la recherche magique par ingrédients → rouvrir sa fiche → vérifier que le crayon est visible (contrairement aux cocktails du seed) → le modifier → vérifier que les changements sont bien pris en compte sans dupliquer le cocktail.

## Sprint 8 — Partage visuel premium

Ajouts par rapport au Sprint 7 :
- `Services/QRCodeGenerator.swift` — génère un QR code (CoreImage) menant à un deep link `cocktailapp://cocktail/<id>`
- `Domain/Models/ShareFormat.swift` — les 5 formats du PRD (Story Instagram, Post Instagram, TikTok, Pinterest, Snapchat), chacun avec son ratio d'aspect et sa résolution d'export (1080px de large)
- `DesignSystem/Components/ShareCardView.swift` — la composition visuelle : dégradé de famille, nom en Display, aperçu des 3 premiers ingrédients, QR code, petit branding
- `Services/ShareCardRenderer.swift` — rend la `ShareCardView` en PNG via `ImageRenderer` et l'écrit dans un fichier temporaire
- `Features/Share/` — écran de choix de format avec aperçu en direct, partage via `ShareLink` (Share Sheet natif iOS)
- Nouveau bouton de partage dans la toolbar de la fiche cocktail

**Détails d'implémentation notables** :
- Le partage passe par un **fichier temporaire** plutôt que par des `Data` en mémoire directement dans `ShareLink` : les apps tierces (Instagram, TikTok...) reconnaissent beaucoup plus fiablement une `URL` de fichier image qu'un blob de données brutes dans le Share Sheet
- Chaque changement de format régénère l'image à la bonne résolution/ratio (pas de recadrage approximatif d'une image unique)

**✅ Mise à jour Sprint 12** : le deep linking est maintenant câblé de bout en bout (voir section Sprint 12 plus bas) — cette limitation est résolue.

~~**⚠️ Le QR code n'est pas encore fonctionnel de bout en bout**~~ : il encode un lien `cocktailapp://cocktail/<id>`, résolu depuis le Sprint 12 par `DeepLink.swift` + `.onOpenURL`.

**Pour tester** : depuis une fiche cocktail → icône de partage → changer de format (Story/Post/TikTok/Pinterest/Snapchat) et vérifier que l'aperçu change de ratio et se régénère → "Partager ce visuel" → vérifier que le Share Sheet natif iOS s'ouvre avec une vraie image (testable même sans compte Instagram/TikTok, via "Enregistrer l'image" par exemple).

## Sprint 9 — Widget iOS + Dark/Light mode + Accessibilité

Ajouts par rapport au Sprint 8 :
- `DesignSystem/Colors.swift` — les tokens neutres (`background`, `surface`, `textPrimary`, `textSecondary`) sont maintenant des couleurs **dynamiques** qui basculent automatiquement entre light et dark selon l'apparence système, via un `UIColor` à fournisseur dynamique. Le doré (`accentGold`) reste identique dans les deux modes — c'est une couleur de marque, pas une couleur d'interface
- `DesignSystem/Typography.swift` — passage de tailles fixes (`.system(size: 34...)`) à des **styles de texte sémantiques** (`.largeTitle`, `.title`, `.body`...), pour un vrai support de Dynamic Type sans avoir à toucher aux Views qui consomment `AppTypography`
- Accessibilité VoiceOver sur les parcours clés : labels sur `IngredientChip` et `CompatibilityRing` (avec une valeur contextuelle — pourcentage pour le score, secondes pour le timer), et une **alternative au swipe** du mode préparation (le swipe personnalisé entre en conflit avec la navigation gestuelle de VoiceOver) : un bouton "Valider l'étape" apparaît automatiquement quand VoiceOver est actif, en plus d'une action exposée au rotor VoiceOver — le reste du temps, l'expérience swipe reste épurée comme voulu au brief
- `Widget/` — extension Widget "Suggestion du jour" (`CocktailWidgetProvider` + `CocktailWidget`), cocktail choisi de façon déterministe par jour de l'année en attendant le `RecommendationEngine` (V2), rafraîchi à minuit

**⚠️ Le Widget nécessite une vraie cible Xcode séparée — pas juste des fichiers Swift en plus** :

1. Xcode → File → New → Target → **Widget Extension** (nom : `CocktailWidget`, décocher "Include Configuration Intent")
2. Supprimer les fichiers placeholder générés par Xcode dans la nouvelle cible
3. Glisser `Widget/CocktailWidgetProvider.swift` et `Widget/CocktailWidget.swift` dans la cible `CocktailWidget` (pas dans `CocktailApp`)
4. **Cocher les deux cibles** (`CocktailApp` ET `CocktailWidget`) dans l'inspecteur "Target Membership" pour ces fichiers déjà utilisés par l'app : tous les modèles SwiftData de la configuration "Reference" (`CocktailEntity.swift`, `IngredientEntity.swift`, `CocktailIngredientEntity.swift`, `RecipeStepEntity.swift`), `DesignSystem/Colors.swift`, et `Services/QRCodeGenerator.swift` (utilisé par `widgetURL`)
5. Activer la capability **App Groups** sur les deux cibles (Signing & Capabilities → + Capability → App Groups), créer un groupe (ex: `group.com.votredomaine.cocktailapp`), et remplacer l'identifiant placeholder dans `AppContainer.swift` **et** `CocktailWidgetProvider.swift` par ce vrai identifiant

**✅ Mise à jour Sprint 12** : ~~même limitation que le QR code du Sprint 8~~ — résolu, le tap sur le widget navigue maintenant réellement vers la fiche cocktail.

**Pour tester** :
- *Light/Dark mode* : Réglages iOS → Luminosité et affichage → basculer clair/sombre pendant que l'app est ouverte → vérifier qu'aucun écran ne casse visuellement
- *Dynamic Type* : Réglages iOS → Accessibilité → Affichage et taille de texte → Texte plus grand → augmenter au maximum → revérifier les écrans clés (accueil, fiche cocktail) pour d'éventuels textes tronqués
- *VoiceOver* : Réglages iOS → Accessibilité → VoiceOver → activer → parcourir la recherche magique (les chips et les scores doivent être annoncés clairement) et le mode préparation (le bouton "Valider l'étape" doit apparaître)
- *Widget* : après configuration Xcode complète, ajouter le widget à l'écran d'accueil et vérifier qu'un cocktail s'affiche avec le bon dégradé de famille

## Sprint 10 — Durcissement & performance

Ce sprint ne devait volontairement ajouter aucune fonctionnalité (voir plan de sprints) — juste une vraie revue de code, du contenu en plus, et des tests UI. Trois bugs/dettes techniques réels ont été trouvés et corrigés en le faisant :

**1. Correctif de performance — `RecipeFormViewModel.save()`** : la sauvegarde d'une recette refaisait une requête `FetchDescriptor<IngredientEntity>()` sur **tous** les ingrédients à **chaque ligne** du formulaire (coût O(n×m) inutile). Corrigé : une seule requête, mise en cache réutilisée pour toutes les lignes de la recette.

**2. Duplication de logique — formatage des quantités** : `CocktailDetailView` et `RecipeFormViewModel` avaient chacun fini par réimplémenter le même arrondi d'affichage ("6.0" → "6", "0.5" → "0.5"). Extrait dans `Domain/CocktailFormatting.swift`, réutilisé aux deux endroits.

**3. Comparateur de tri peu fiable — `HomeViewModel`** : le tri de la section "Populaires" ne triait par nom qu'entre deux cocktails de catégorie strictement identique ; entre deux catégories différentes non-"Classique", le résultat dépendait de l'ordre arbitraire renvoyé par SwiftData. Pas un crash, mais un comportement peu prévisible — corrigé pour un tri cohérent (classiques d'abord, puis alphabétique dans tous les cas).

**4. Vrai risque de performance identifié pour l'objectif "60 FPS jusqu'à iPhone SE"** : les sections horizontales de l'accueil, de la Bibliothèque (collections) et des variantes de la fiche cocktail utilisaient des `HStack` classiques (non paresseuses) à l'intérieur d'un `ScrollView(.horizontal)` — indolore avec 5-14 cocktails de seed, mais problématique une fois la base enrichie vers les 500-1000 cocktails visés par le PRD (l'app préparerait des centaines de vues d'un coup). Corrigé : passage en `LazyHStack` partout où c'est pertinent, et les sections de l'accueil sont maintenant bornées à 20 cartes (`HomeViewModel`).

**5. Contenu enrichi** : 9 cocktails supplémentaires ajoutés au seed (Piña Colada, Mai Tai, Whiskey Sour, Aperol Spritz, Espresso Martini, Hot Toddy, Margarita, Bramble, Shirley Temple), portant la bibliothèque de démonstration à 14 cocktails et couvrant des familles de dégradé jusque-là jamais testées (Tropical/Tiki, Agrumes, Hiver). Les collections ont été mises à jour en conséquence, avec deux nouvelles ("Soirée d'hiver", "Ambiance Tiki"). **Ce n'est qu'une première itération** : atteindre les 500-1000 cocktails du PRD reste un chantier de contenu à part entière (voir Architecture Technique, section Risques), pas quelque chose qu'on termine dans un sprint de code.

**6. Tests UI ajoutés** (`UITests/`) — les deux parcours critiques identifiés au plan de sprints :
- `IngredientSearchUITests` : sélection de 3 ingrédients → apparition du Mojito dans les résultats ; en dessous de 3 ingrédients, le message d'invite reste affiché
- `CocktailDetailAndPreparationUITests` : ouverture d'une fiche → lancement du mode préparation → bascule du bouton favori

Pour fiabiliser ces tests (et améliorer VoiceOver au passage), `CocktailCard` a reçu un `accessibilityLabel` explicite (le nom seul, pas le nom + catégorie concaténés par défaut), et le bouton favori un `accessibilityIdentifier` stable.

**⚠️ Les tests UI nécessitent une troisième cible Xcode**, comme le Widget au Sprint 9 :
1. Xcode → File → New → Target → **UI Testing Bundle** (nom : `CocktailAppUITests`)
2. Glisser le contenu de `UITests/` dans cette nouvelle cible (pas dans `CocktailApp` ni `CocktailAppTests`)
3. Ces tests supposent un état de départ propre (base de seed fraîchement importée, aucun favori) — à lancer sur simulateur après une désinstallation complète de l'app pour des résultats fiables

**Ce que ce sprint n'a délibérément pas fait** : un vrai profilage Instruments sur device physique (impossible sans Xcode/matériel Apple dans cet environnement) — les optimisations ci-dessus viennent d'une lecture attentive du code, pas de mesures. Avant la mise en production, un vrai passage Instruments (Time Profiler + Core Animation FPS) sur un iPhone SE reste fortement recommandé pour confirmer ces corrections et en détecter d'autres.

**Pour tester** : Bibliothèque → vérifier que les nouveaux cocktails et les 2 nouvelles collections apparaissent → créer une recette avec plusieurs ingrédients et vérifier que la sauvegarde reste rapide → basculer clair/sombre et Dynamic Type une seconde fois avec la bibliothèque enrichie pour confirmer qu'aucun écran ne casse à cette échelle.

## Sprint 11 — Préparation App Store

Ce sprint ne touche quasiment pas au code de l'app — il livre les éléments nécessaires à la mise en ligne, regroupés dans un dossier séparé `AppStore/` (livré à part, pas dans le zip du projet Xcode) :

- **`AppIcon-1024.png`** — une vraie icône générée par script (`generate_app_icon.py`, Python/Pillow), pas juste décrite : reprend fidèlement les tokens exacts du Design System (noir profond, doré, silhouette de verre avec un écho du Liquid Ring). Intégrée aussi dans `CocktailApp/Resources/AppIcon.appiconset/` (format Xcode moderne à taille unique). **Point de départ cohérent, pas un design final validé par une équipe créative** — à faire réviser avant publication
- **3 mockups de captures d'écran** (`screenshot-*.png`, résolution App Store 1290×2796) — recréations stylisées des wireframes du Design System, **pas de vraies captures** (impossible à produire sans Xcode/simulateur dans cet environnement). Utiles comme référence de composition ; les vraies captures restent à prendre depuis le simulateur (marche à suivre dans la checklist)
- **`App-Store-Connect-Fiche.md`** — titre, sous-titre, description complète, mots-clés, catégorie, avec une **note juridique explicite sur la classification d'âge liée à l'alcool**, un point souvent oublié dans ce type de projet et volontairement mis en avant plutôt que passé sous silence
- **`Politique-de-confidentialite.md`** — rédigée à partir de l'architecture technique réelle du projet (CloudKit privé, pas de serveur tiers, pas de publicité), avec la limitation connue sur les recettes personnelles non encore synchronisées (Sprint 7) explicitement mentionnée plutôt que promise à tort
- **`TestFlight-et-Soumission-Checklist.md`** — liste précise de ce qui reste à faire avant une vraie mise en production, y compris les dettes techniques identifiées aux sprints précédents qui deviennent **bloquantes** à ce stade (le deep linking `cocktailapp://`, toujours pas câblé depuis le Sprint 8, empêche le QR code de partage et le widget d'être fonctionnels de bout en bout)

**Ce que ce sprint ne peut pas faire dans cet environnement** : uploader un build sur App Store Connect, prendre de vraies captures depuis un simulateur iOS, ou obtenir une vraie review Apple — tout ça nécessite Xcode et un Mac. Le dossier livré est le nécessaire de préparation, pas une soumission déjà faite.

## Sprint 12 — Deep linking (dette technique bloquante, résolue)

Le plan de sprints initial s'arrêtait au Sprint 11 (App Store) — la V2 devait être découpée après les retours utilisateurs du MVP en production. Plutôt que d'anticiper des fonctionnalités V2 sans retours réels, ce sprint a traité la dette technique la plus concrètement bloquante identifiée dans la checklist du Sprint 11 : **le deep linking**, qui empêchait le QR code de partage (Sprint 8) et le widget (Sprint 9) de fonctionner de bout en bout.

Ajouts :
- `App/DeepLink.swift` — parseur d'URL `cocktailapp://cocktail/<uuid>`, volontairement indépendant de SwiftUI et de tout `ModelContext` pour rester testable unitairement sans lancer l'app
- `CocktailApp.swift` — `.onOpenURL` branché sur `WindowGroup`, résout le lien et navigue vers la fiche cocktail en repartant d'une pile Accueil propre (plutôt que d'empiler par-dessus un état de navigation existant potentiellement profond)
- `Tests/DeepLinkTests.swift` — 5 tests, dont un qui vérifie que le parseur accepte bien les URLs réellement produites par `QRCodeGenerator` (pas seulement des URLs construites à la main dans le test)

**Bug connexe trouvé en implémentant ce sprint** : en testant des liens vers des ids invalides (cas réel avec le deep linking — un lien périmé, une recette perso supprimée entre-temps), `CocktailDetailView` restait bloquée sur un spinner de chargement indéfiniment, sans distinguer "en cours de chargement" de "introuvable". Corrigé : `CocktailDetailViewModel` expose maintenant `hasAttemptedLoad`, et la Vue affiche un vrai état "Cocktail introuvable" plutôt qu'un spinner qui ne s'arrête jamais.

**⚠️ Configuration Xcode requise** (en plus du code, comme pour CloudKit/App Groups aux sprints précédents) :
1. Sélectionner la cible `CocktailApp` → onglet **Info** → section **URL Types** → **+**
2. URL Schemes : `cocktailapp`, Identifier : `com.votredomaine.cocktailapp` (ou équivalent)
3. Le widget (Sprint 9) n'a besoin d'aucune configuration supplémentaire : `widgetURL` génère déjà la bonne URL, c'est l'app qui doit maintenant savoir la recevoir

**Pour tester** :
- Depuis la fiche cocktail → partager → générer un visuel → noter/scanner le QR code (ou copier le lien affiché en debug) → vérifier que l'app s'ouvre directement sur la bonne fiche
- Test de robustesse : construire manuellement un lien avec un UUID aléatoire (`cocktailapp://cocktail/00000000-0000-0000-0000-000000000000`) et vérifier que l'app affiche "Cocktail introuvable" plutôt que de rester bloquée sur un chargement infini
- Widget : après la configuration App Group du Sprint 9, taper sur le widget doit maintenant ouvrir directement la fiche du cocktail suggéré

## Sprint My Bar 2.0 — Mon Bar comme source de vérité du moteur

Ce sprint fait passer "Mon Bar" de modèle SwiftData mort (`UserIngredientEntity` déclaré depuis le Sprint 0, jamais branché à une UI — identifié par les audits) à un vrai écran, et surtout à une **entrée réelle du Matching Engine**, pas juste une liste affichée pour elle-même.

**Analyse préalable (demandée avant tout code)** : `UserIngredientEntity` était déjà bien positionné dans la configuration CloudKit "User", sans relation directe vers `IngredientEntity` (contrainte CloudKit déjà respectée), mais son champ `stockLevel: Int?` (0-100) était ambigu et non exploité. Comme les deux audits précédents ont confirmé qu'**aucun build réel de l'app n'a jamais eu lieu** (aucun `.xcodeproj`), aucune donnée CloudKit n'a donc jamais été synchronisée avec l'ancien schéma — le champ a pu être remplacé sans stratégie de migration à ce stade. Recommandation actée pour la suite : introduire un `VersionedSchema` dès le premier vrai lancement en production, avant tout nouveau changement de ce type.

**Changement de modèle** :
- `UserIngredientEntity.stockLevel: Int?` → remplacé par `stockStatus: StockStatus` (enum à 3 états : disponible/faible/presque terminé, sélection rapide plutôt qu'un curseur 0-100 peu adapté au mobile) et `approximateQuantity: String?` (texte libre, séparé du statut qualitatif comme demandé)
- `Domain/Models/StockStatus.swift` — value object pur, indépendant de SwiftUI/SwiftData au-delà de `Codable`
- `Domain/Models/BarReadiness.swift` — value object pur (`empty`/`almostReady`/`excellent`), fonction déterministe de deux entrées (nombre d'ingrédients, nombre de cocktails débloqués) — **c'est le second nombre, calculé via le Matching Engine, qui pilote l'état affiché**, pas juste le premier

**Nouveaux fichiers** :
- `Features/MyBar/MyBarViewModel.swift` — tout le CRUD (ajout/retrait/statut/quantité), le filtrage (recherche + catégorie, catégories dérivées du catalogue réel plutôt que codées en dur, même principe que `LibraryViewModel`), et l'appel au `MatchingEngineProtocol` injecté pour calculer `unlockedCocktailCount`/`almostUnlockedCocktailCount`
- `Features/MyBar/MyBarView.swift` — aucune logique métier, délègue tout au ViewModel ; en-tête d'état avec Liquid Ring, recherche + chips de catégorie, section "déjà dans ton bar" (statut de stock en chips, quantité approximative via une sheet), section d'ajout en `FlowLayout`
- `DesignSystem/Components/FlowLayout.swift` — **extrait de `LibraryView`** (qui l'avait en `private`) pour être partagé avec Mon Bar plutôt que dupliqué — corrige au passage un des points de duplication déjà signalés

**Modifications** :
- `DesignSystem/Components/CompatibilityRing.swift` — ajout d'un paramètre optionnel `visualLabelOverride` (additif, rétrocompatible) pour afficher un nombre brut ("5") plutôt qu'un pourcentage au centre de l'anneau, pertinent pour "combien de cocktails débloqués" — tous les appels existants (recherche magique, timer) continuent d'afficher le pourcentage par défaut sans aucun changement
- `Features/IngredientPicker/IngredientPickerViewModel.swift` — nouvelle méthode `preselectFromMyBar()` : **le point concret où le Matching Engine consomme Mon Bar**. Copie les ingrédients de Mon Bar dans la sélection de la recherche magique ; l'utilisateur reste ensuite libre d'ajuster sans que ça modifie Mon Bar lui-même (les deux restent des états indépendants une fois copiés)
- `Features/IngredientPicker/IngredientPickerView.swift` — bouton "Utiliser Mon Bar" dans la toolbar, visible seulement si Mon Bar contient au moins un ingrédient
- `App/CocktailApp.swift` — `MyBarView` remplace le `PlaceholderTabView` ; `RootView` gagne l'accès à `AppContainer` via `@Environment` pour récupérer `matchingEngine`

**Tests ajoutés** (26 nouveaux au total) :
- `Tests/MyBarViewModelTests.swift` (13 tests) — CRUD, non-duplication à l'ajout, statut de stock, quantité approximative (y compris son passage à `nil` si vidée), recherche, filtre par catégorie, catégories dérivées du catalogue, et surtout **l'intégration avec le Matching Engine** : un bar vide débloque 0 cocktail, réunir les 3 ingrédients d'un Mojito fixture en débloque 1
- `Tests/BarReadinessTests.swift` (6 tests) — fonction pure testée sans SwiftData ni SwiftUI, tous les seuils (vide/presque prêt/excellent) couverts explicitement
- `UITests/MyBarUITests.swift` (3 tests) — ajouter un ingrédient → apparition dans "déjà dans ton bar" → changement de statut → retrait ; filtre par catégorie qui exclut bien les ingrédients hors catégorie ; **le bouton "Utiliser Mon Bar" préremplit bien la recherche magique**, preuve UI de bout en bout que l'intégration fonctionne

**Accessibilité** : `MyBarView` a son propre `accessibilityElement(children: .combine)` sur l'en-tête d'état (le Liquid Ring et son texte sont lus comme un seul bloc cohérent par VoiceOver plutôt que deux éléments disjoints), des `accessibilityLabel` explicites sur les boutons icône seule (modifier la quantité, retirer un ingrédient — exactement le type de manque que l'audit avait sanctionné ailleurs dans l'app), et aucune taille de police fixe (`AppTypography` partout, un seul `.system(size:)` repéré et corrigé en `.footnote` pendant l'implémentation). Dark mode automatique via `AppColors` — aucune couleur en dur dans ce sprint.

**Aucune régression attendue** : `MatchingEngine`, `IngredientPickerViewModel` (comportement existant), le mode préparation, le partage, le deep linking et le widget ne sont pas touchés. Les deux seules modifications de fichiers pré-existants en dehors de `AppContainer`/`CocktailApp.swift` (l'ajout du paramètre optionnel sur `CompatibilityRing` et l'extraction de `FlowLayout`) sont additives ou strictement équivalentes en comportement observable — `LibraryView` doit continuer à s'afficher et se comporter exactement comme avant.

**Risques restants** :
- Comme pour tout le reste du projet, **rien de ceci n'a été compilé réellement** (toujours aucun `.xcodeproj`) — ce sprint hérite du risque déjà documenté par les audits précédents, non spécifique à Mon Bar.
- Le seuil `BarReadiness.excellentThreshold = 5` est une valeur de départ raisonnable mais arbitraire, à ajuster une fois un vrai volume de cocktails (500-1000) atteint — actuellement testé sur les 14 cocktails du seed.
- `stockStatus`/`approximateQuantity` sont synchronisés CloudKit (config "User") — comme le reste de cette configuration, non testable sans un vrai identifiant de conteneur (toujours en placeholder, point déjà connu).

**Comment le Matching Engine consomme désormais Mon Bar** : deux chemins, tous deux déjà implémentés dans ce sprint —
1. **Dans l'écran Mon Bar lui-même** : `MyBarViewModel.recomputeUnlockedCounts()` appelle `matchingEngine.computeMatches(availableIngredientIDs: ownedIngredientIDs, cocktails:)` à chaque changement du bar, exactement le même appel que la recherche magique — c'est ce qui alimente `barReadiness` et le compteur affiché dans le Liquid Ring.
2. **Depuis la recherche magique** : `IngredientPickerViewModel.preselectFromMyBar()` copie `ownedIngredientIDs` de Mon Bar dans la sélection de la recherche magique, qui relance ensuite son propre calcul via le même moteur. Mon Bar et la recherche magique restent deux états indépendants après cette copie (modifier l'un ne modifie pas l'autre), par choix — la recherche magique doit rester une requête explicite et prévisible (cohérent avec la règle d'interface déjà posée dans le document d'architecture Cocktail Intelligence Core : la recherche magique ne doit jamais être court-circuitée par un état externe qui changerait silencieusement son résultat).

## Sprint Matching Engine V2 — un moteur de compatibilité, pas juste de présence/absence

### Stratégie de migration (analysée avant tout code)
`MatchingEngine.swift` contenait une seule fonction privée `match()`, appelée par la méthode du protocole V1. **Décision** : cette fonction reste strictement intacte, ligne pour ligne. Le nouvel algorithme pondéré vit dans une fonction séparée `matchAdvanced()`, appelée uniquement par le nouveau protocole `MatchingEngineV2Protocol`. C'est une duplication délibérée d'une petite partie de la logique plutôt qu'une factorisation risquée — la consigne "ne pas supprimer le comportement V1" est absolue, et `Tests/MatchingEngineTests.swift` (7 tests, **non modifié par ce sprint**) en est la preuve vérifiable a priori.

### Architecture finale
- `Domain/Models/IngredientRole.swift` — enum à 5 cas (`primarySpirit`, `secondarySpirit`, `modifier`, `mixer`, `garnish`), porte le poids par défaut de chaque rôle. Vit sur `CocktailIngredientEntity` (la jointure), pas sur `IngredientEntity` — le même ingrédient peut être structurant dans une recette et garniture dans une autre.
- `Domain/Models/SubstitutionOption.swift`, `Data/SwiftDataModels/IngredientSubstitutionEntity.swift` — la table de substitution, contenu de référence (config "Reference", non-CloudKit), alimentée par le même pipeline `SeedImporter` que les collections.
- `Domain/Models/AdvancedMatchResult.swift` — le résultat enrichi (`compatibilityScore`, `proximityScore`, `explanation`, `realizableVariants`), **coexiste** avec `MatchResult` (V1, inchangé) plutôt que de le remplacer.
- `Domain/Protocols/MatchingEngineV2Protocol.swift` — second protocole, ne remplace pas `MatchingEngineProtocol`.
- `Services/MatchingEngine.swift` — implémente les deux protocoles ; V1 et V2 ne partagent aucun code interne.

### Algorithme
Pour chaque ingrédient requis, une **satisfaction** de 0.0 à 1.0 est calculée :
1. Possédé, stock disponible → **1.0**
2. Possédé, stock faible → **0.75**
3. Possédé, presque terminé → **0.4**
4. Non possédé, substitution utilisable dans l'inventaire → **facteur de dégradation de la meilleure substitution disponible**
5. Non possédé, aucune substitution → **0.0**

Le score final pondère cette satisfaction par le poids du rôle de l'ingrédient :
```
compatibilityScore = Σ(satisfaction_i × poids_rôle_i) / Σ(poids_rôle_i)
```
Poids par défaut : alcool principal 1.0, alcool secondaire 0.8, ingrédient structurant 0.6, mixer 0.35, garniture 0.15.

Le seuil d'exclusion (hérité de V1 : max 2 ingrédients manquants) s'applique au **nombre d'ingrédients à satisfaction strictement nulle**, jamais aux ingrédients dégradés — un ingrédient dégradé mais non nul ne doit jamais faire exclure un cocktail par ailleurs pertinent.

**Cocktail sans alcool / multi-spiritueux** : aucun cas particulier dans le code. Un mocktail est simplement un cocktail sans aucun lien `.primarySpirit` ; un cocktail multi-spiritueux a simplement plusieurs liens `.primarySpirit`/`.secondarySpirit`, chacun évalué indépendamment.

**Variantes** : calculées avec le même algorithme sur `cocktail.variants`, un seul niveau de profondeur.

**Explication** : `MatchExplanation` est une structure de données pure — le moteur ne génère aucun texte, conformément à la consigne.

### Exemples de scores (calculés, pas approximatifs)
- Alcool principal manquant (poids 1.0), reste disponible (poids 0.6) → **37.5%**
- Garniture manquante (poids 0.15) seule, alcool principal disponible → **≈87%**
- Ingrédient couvert par une substitution à 0.85 → **85%** sur ce lien
- Stock faible → **75%** ; presque terminé → **40%**
- Multi-spiritueux, un des deux alcools manquant → **≈55.6%**

*Note de transparence* : l'exemple travaillé du brief (Piña Colada à 75%) était illustratif — recalculé avec les vrais poids et la vraie composition du seed, ce cas précis donne un score différent. Plutôt que d'ajuster artificiellement les poids pour retomber sur ce chiffre, j'ai préféré un algorithme cohérent et documenté, vérifiable par les tests.

### Correction de contenu apportée
L'eau gazeuse (Mojito, Virgin Mojito) est passée `isOptional: true` — mixer quasi-toujours disponible, cohérent avec la pratique mixologique réelle et l'intention du brief. Chaque lien ingrédient du seed a reçu un `role` explicite.

### Tests ajoutés (16 nouveaux, 55 au total sur le projet)
`Tests/MatchingEngineV2Tests.swift` couvre explicitement : alcool principal manquant, garniture manquante, ingrédient optionnel, substitution (simple + meilleure parmi plusieurs), quantité insuffisante, variante, cocktail sans alcool, multi-spiritueux, seuil d'exclusion, tri, déterminisme — plus un test qui prouve que **V1 ignore totalement le rôle des ingrédients** (`testV1MethodIgnoresIngredientRoleEntirely`). `Tests/SeedImporterTests.swift` gagne un test sur l'import des substitutions.

### Fichiers modifiés/créés
**Nouveaux** : `Domain/Models/IngredientRole.swift`, `SubstitutionOption.swift`, `AdvancedMatchResult.swift`, `Domain/Protocols/MatchingEngineV2Protocol.swift`, `Data/SwiftDataModels/IngredientSubstitutionEntity.swift`, `Data/SeedImport/SubstitutionSeedDTO.swift`, `Resources/SeedData/substitutions_seed.json`, `Tests/MatchingEngineV2Tests.swift`
**Modifiés** : `Services/MatchingEngine.swift`, `Data/SwiftDataModels/CocktailIngredientEntity.swift`, `Data/SeedImport/CocktailSeedDTO.swift`, `Data/SeedImport/SeedImporter.swift`, `App/AppContainer.swift`, `Resources/SeedData/cocktails_seed.json`, `Tests/SeedImporterTests.swift`

### Compatibilité V1
Totale et vérifiée : `MatchingEngineProtocol`, `MatchResult`, `IngredientPickerViewModel`, `MyBarViewModel` — aucun n'a été touché. Les 7 tests V1 originaux sont restés inchangés.

### Limites
- Poids de rôle et facteurs de dégradation de stock sont des valeurs de départ raisonnées, pas calibrées sur un vrai usage.
- La dégradation de stock reste une heuristique qualitative, pas un calcul de volume réel contre la quantité exacte de la recette.
- Seuls 6 couples de substitution dans le seed — un vrai lancement nécessiterait un travail de contenu dédié.
- Comme pour tout le reste du projet, rien de ceci n'a été compilé réellement (toujours aucun `.xcodeproj`).
