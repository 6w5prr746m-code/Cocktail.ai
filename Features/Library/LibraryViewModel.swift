import SwiftUI
import SwiftData
import Observation

/// ViewModel de l'onglet Bibliothèque — recherche multicritère (US-B2)
/// et collections thématiques (US-B3).
///
/// Note sur les critères de recherche du PRD ("nom, alcool, ingrédients,
/// couleur, difficulté, occasion") : le modèle de données actuel n'a pas
/// de champ "couleur" dédié (seul `category` existe, utilisé à la fois
/// pour le dégradé visuel et pour ce qui se rapproche d'une "occasion").
/// Plutôt que de dupliquer artificiellement un même champ sous deux
/// filtres différents, "couleur" est volontairement omis ici et signalé
/// comme dépendant d'un enrichissement futur du modèle (voir README).
@MainActor
@Observable
final class LibraryViewModel {

    private let modelContext: ModelContext

    var allCocktails: [CocktailEntity] = []
    var collections: [CollectionEntity] = []

    var searchText: String = ""
    var selectedSpirits: Set<String> = []
    var selectedDifficulties: Set<Int> = []
    var selectedOccasions: Set<String> = []

    var availableSpirits: [String] = []
    var availableOccasions: [String] = []

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func load() {
        allCocktails = (try? modelContext.fetch(FetchDescriptor<CocktailEntity>(sortBy: [SortDescriptor(\.name)]))) ?? []
        collections = (try? modelContext.fetch(FetchDescriptor<CollectionEntity>(sortBy: [SortDescriptor(\.name)]))) ?? []

        availableSpirits = Array(Set(allCocktails.map(\.mainSpirit))).sorted()
        availableOccasions = Array(Set(allCocktails.map(\.category))).sorted()
    }

    var filteredCocktails: [CocktailEntity] {
        allCocktails.filter { cocktail in
            matchesSearchText(cocktail) &&
            matchesSpirit(cocktail) &&
            matchesDifficulty(cocktail) &&
            matchesOccasion(cocktail)
        }
    }

    var hasActiveFilters: Bool {
        !searchText.isEmpty || !selectedSpirits.isEmpty || !selectedDifficulties.isEmpty || !selectedOccasions.isEmpty
    }

    func toggleSpirit(_ spirit: String) {
        toggle(spirit, in: &selectedSpirits)
    }

    func toggleDifficulty(_ difficulty: Int) {
        toggle(difficulty, in: &selectedDifficulties)
    }

    func toggleOccasion(_ occasion: String) {
        toggle(occasion, in: &selectedOccasions)
    }

    func clearFilters() {
        searchText = ""
        selectedSpirits.removeAll()
        selectedDifficulties.removeAll()
        selectedOccasions.removeAll()
    }

    // MARK: - Filtrage

    private func matchesSearchText(_ cocktail: CocktailEntity) -> Bool {
        guard !searchText.isEmpty else { return true }
        if cocktail.name.localizedCaseInsensitiveContains(searchText) {
            return true
        }
        // Recherche par ingrédient (US-B2 : "nom" + "ingrédients" dans le
        // même champ de recherche libre, pour ne pas multiplier les champs UI).
        return cocktail.ingredients.contains {
            $0.ingredient.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    private func matchesSpirit(_ cocktail: CocktailEntity) -> Bool {
        selectedSpirits.isEmpty || selectedSpirits.contains(cocktail.mainSpirit)
    }

    private func matchesDifficulty(_ cocktail: CocktailEntity) -> Bool {
        selectedDifficulties.isEmpty || selectedDifficulties.contains(cocktail.difficulty)
    }

    private func matchesOccasion(_ cocktail: CocktailEntity) -> Bool {
        selectedOccasions.isEmpty || selectedOccasions.contains(cocktail.category)
    }

    private func toggle<T: Hashable>(_ value: T, in set: inout Set<T>) {
        if set.contains(value) {
            set.remove(value)
        } else {
            set.insert(value)
        }
    }
}
