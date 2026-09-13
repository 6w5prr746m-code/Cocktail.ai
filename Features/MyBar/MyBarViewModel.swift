import SwiftUI
import SwiftData
import Observation

/// ViewModel de "Mon Bar" (Sprint My Bar 2.0). Fait de Mon Bar la source
/// de vérité consommable par le Matching Engine : `unlockedCocktailCount`
/// et `barReadiness` sont calculés en appelant le même `MatchingEngine`
/// que la recherche magique, sur les ingrédients réellement possédés —
/// pas une estimation séparée.
@MainActor
@Observable
final class MyBarViewModel {

    private let modelContext: ModelContext
    private let matchingEngine: MatchingEngineProtocol

    /// Catalogue complet de référence (pour proposer quoi ajouter).
    private(set) var allIngredients: [IngredientEntity] = []
    /// Entrées "Mon Bar" de l'utilisateur, résolues avec leur ingrédient
    /// de référence — voir `MyBarEntry` ci-dessous pour le pourquoi de
    /// cette résolution manuelle plutôt qu'une relation SwiftData directe.
    private(set) var myBarEntries: [MyBarEntry] = []

    var searchText: String = ""
    var selectedCategory: String?

    private(set) var unlockedCocktailCount: Int = 0
    private(set) var almostUnlockedCocktailCount: Int = 0

    init(modelContext: ModelContext, matchingEngine: MatchingEngineProtocol) {
        self.modelContext = modelContext
        self.matchingEngine = matchingEngine
    }

    // MARK: - Chargement

    func load() {
        let ingredientDescriptor = FetchDescriptor<IngredientEntity>(sortBy: [SortDescriptor(\.name)])
        allIngredients = (try? modelContext.fetch(ingredientDescriptor)) ?? []

        let ownedDescriptor = FetchDescriptor<UserIngredientEntity>()
        let owned = (try? modelContext.fetch(ownedDescriptor)) ?? []
        let ingredientsByID = Dictionary(uniqueKeysWithValues: allIngredients.map { ($0.id, $0) })

        myBarEntries = owned.compactMap { entry in
            guard let ingredient = ingredientsByID[entry.ingredientID] else { return nil }
            return MyBarEntry(entry: entry, ingredient: ingredient)
        }
        .sorted {
            $0.entry.stockStatus.sortOrder == $1.entry.stockStatus.sortOrder
                ? $0.ingredient.name < $1.ingredient.name
                : $0.entry.stockStatus.sortOrder < $1.entry.stockStatus.sortOrder
        }

        recomputeUnlockedCounts()
    }

    // MARK: - Données dérivées pour l'UI

    /// Catégories réellement présentes dans le catalogue — jamais codées
    /// en dur, pour ne jamais devenir périmées si le contenu évolue (même
    /// principe déjà appliqué par `LibraryViewModel` pour ses filtres).
    var availableCategories: [String] {
        Array(Set(allIngredients.map(\.category))).sorted()
    }

    var ownedIngredientIDs: Set<UUID> {
        Set(myBarEntries.map(\.ingredient.id))
    }

    /// Catalogue filtré par recherche + catégorie, pour la grille d'ajout.
    var filteredCatalog: [IngredientEntity] {
        allIngredients.filter { ingredient in
            let matchesSearch = searchText.isEmpty
                || ingredient.name.localizedCaseInsensitiveContains(searchText)
            let matchesCategory = selectedCategory == nil || ingredient.category == selectedCategory
            return matchesSearch && matchesCategory
        }
    }

    var barReadiness: BarReadiness {
        BarReadiness.evaluate(
            ingredientCount: myBarEntries.count,
            unlockedCocktailCount: unlockedCocktailCount
        )
    }

    // MARK: - Actions

    func toggle(_ ingredient: IngredientEntity) {
        if ownedIngredientIDs.contains(ingredient.id) {
            remove(ingredient)
        } else {
            add(ingredient)
        }
    }

    func add(_ ingredient: IngredientEntity) {
        guard !ownedIngredientIDs.contains(ingredient.id) else { return }
        let entry = UserIngredientEntity(ingredientID: ingredient.id)
        modelContext.insert(entry)
        try? modelContext.save()
        load()
    }

    func remove(_ ingredient: IngredientEntity) {
        guard let match = myBarEntries.first(where: { $0.ingredient.id == ingredient.id }) else { return }
        modelContext.delete(match.entry)
        try? modelContext.save()
        load()
    }

    func updateStockStatus(_ ingredient: IngredientEntity, to status: StockStatus) {
        guard let match = myBarEntries.first(where: { $0.ingredient.id == ingredient.id }) else { return }
        match.entry.stockStatus = status
        try? modelContext.save()
        load()
    }

    func updateApproximateQuantity(_ ingredient: IngredientEntity, to text: String) {
        guard let match = myBarEntries.first(where: { $0.ingredient.id == ingredient.id }) else { return }
        match.entry.approximateQuantity = text.isEmpty ? nil : text
        try? modelContext.save()
    }

    // MARK: - Intégration Matching Engine

    /// Recalcule combien de cocktails sont entièrement réalisables et
    /// combien sont "presque" réalisables, en appelant le même
    /// `MatchingEngineProtocol` que la recherche magique. C'est le point
    /// concret où "Mon Bar" devient une entrée du moteur, pas une simple
    /// liste d'ingrédients affichée pour elle-même.
    private func recomputeUnlockedCounts() {
        let cocktailDescriptor = FetchDescriptor<CocktailEntity>()
        let cocktails = (try? modelContext.fetch(cocktailDescriptor)) ?? []

        let results = matchingEngine.computeMatches(
            availableIngredientIDs: ownedIngredientIDs,
            cocktails: cocktails
        )

        unlockedCocktailCount = results.filter(\.isFullyAvailable).count
        almostUnlockedCocktailCount = results.filter { !$0.isFullyAvailable }.count
    }
}

/// Résolution d'une entrée "Mon Bar" avec son ingrédient de référence.
/// Nécessaire car `UserIngredientEntity` (config CloudKit "User") ne peut
/// pas porter de `@Relationship` vers `IngredientEntity` (config
/// "Reference", non synchronisée) — même contrainte déjà documentée pour
/// `FavoriteEntity`/`HistoryEntryEntity`. Value object jetable, recréé à
/// chaque `load()`, jamais persisté.
struct MyBarEntry: Identifiable {
    let entry: UserIngredientEntity
    let ingredient: IngredientEntity

    var id: UUID { entry.id }
}
