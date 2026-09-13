import SwiftUI
import SwiftData
import Observation

/// ViewModel de la recherche magique (US-A1 à US-A3) : sélection
/// d'ingrédients en temps réel, sans validation, avec recalcul immédiat
/// des résultats via le MatchingEngine du Sprint 1.
@MainActor
@Observable
final class IngredientPickerViewModel {

    private let matchingEngine: MatchingEngineProtocol
    private let modelContext: ModelContext

    /// Règle produit (PRD, US-A1) : il faut au moins 3 ingrédients
    /// sélectionnés avant de déclencher la recherche.
    let minimumIngredientsRequired = 3

    var allIngredients: [IngredientEntity] = []
    var searchText: String = ""
    var selectedIngredientIDs: Set<UUID> = []
    var results: [MatchResult] = []

    var filteredIngredients: [IngredientEntity] {
        guard !searchText.isEmpty else { return allIngredients }
        return allIngredients.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    var hasEnoughIngredients: Bool {
        selectedIngredientIDs.count >= minimumIngredientsRequired
    }

    init(matchingEngine: MatchingEngineProtocol, modelContext: ModelContext) {
        self.matchingEngine = matchingEngine
        self.modelContext = modelContext
    }

    func loadIngredients() {
        let descriptor = FetchDescriptor<IngredientEntity>(sortBy: [SortDescriptor(\.name)])
        allIngredients = (try? modelContext.fetch(descriptor)) ?? []
    }

    /// Nombre d'ingrédients actuellement possédés dans "Mon Bar" — utilisé
    /// par la Vue pour savoir si le bouton "Utiliser Mon Bar" a un sens à
    /// afficher (inutile si Mon Bar est vide).
    var myBarIngredientCount: Int {
        (try? modelContext.fetchCount(FetchDescriptor<UserIngredientEntity>())) ?? 0
    }

    /// Pré-sélectionne les ingrédients déjà déclarés dans "Mon Bar"
    /// (Sprint My Bar 2.0) — c'est le point concret où la recherche
    /// magique consomme Mon Bar comme source de vérité plutôt que de
    /// demander à l'utilisateur de tout re-sélectionner manuellement à
    /// chaque fois. L'utilisateur reste libre d'ajuster la sélection
    /// ensuite (ajouter/retirer un chip) sans que cela ne modifie Mon Bar
    /// lui-même — les deux restent des états indépendants une fois copiés.
    func preselectFromMyBar() {
        let ownedDescriptor = FetchDescriptor<UserIngredientEntity>()
        let owned = (try? modelContext.fetch(ownedDescriptor)) ?? []
        selectedIngredientIDs = Set(owned.map(\.ingredientID))
        recompute()
    }

    func toggle(_ ingredient: IngredientEntity) {
        if selectedIngredientIDs.contains(ingredient.id) {
            selectedIngredientIDs.remove(ingredient.id)
        } else {
            selectedIngredientIDs.insert(ingredient.id)
        }
        recompute()
    }

    func isSelected(_ ingredient: IngredientEntity) -> Bool {
        selectedIngredientIDs.contains(ingredient.id)
    }

    private func recompute() {
        guard hasEnoughIngredients else {
            results = []
            return
        }
        let descriptor = FetchDescriptor<CocktailEntity>()
        let cocktails = (try? modelContext.fetch(descriptor)) ?? []
        results = matchingEngine.computeMatches(
            availableIngredientIDs: selectedIngredientIDs,
            cocktails: cocktails
        )
    }
}
