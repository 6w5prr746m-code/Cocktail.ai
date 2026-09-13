import SwiftUI
import SwiftData
import Observation

/// ViewModel de l'écran de debug du Sprint 1 : permet de cocher des
/// ingrédients dans une liste brute et de voir en direct les résultats
/// du moteur de matching, pour valider sa pertinence perçue avant de
/// construire le vrai picker d'ingrédients (Sprint 2).
@MainActor
@Observable
final class MatchingDebugViewModel {

    private let matchingEngine: MatchingEngineProtocol
    private let modelContext: ModelContext

    var allIngredients: [IngredientEntity] = []
    var selectedIngredientIDs: Set<UUID> = []
    var results: [MatchResult] = []

    init(matchingEngine: MatchingEngineProtocol, modelContext: ModelContext) {
        self.matchingEngine = matchingEngine
        self.modelContext = modelContext
    }

    func loadIngredients() {
        let descriptor = FetchDescriptor<IngredientEntity>(sortBy: [SortDescriptor(\.name)])
        allIngredients = (try? modelContext.fetch(descriptor)) ?? []
    }

    func toggle(_ ingredient: IngredientEntity) {
        if selectedIngredientIDs.contains(ingredient.id) {
            selectedIngredientIDs.remove(ingredient.id)
        } else {
            selectedIngredientIDs.insert(ingredient.id)
        }
        recompute()
    }

    /// Recalcule les résultats à chaque changement de sélection.
    ///
    /// Note : les `@Model` SwiftData ne sont pas `Sendable`, donc ce calcul
    /// reste ici sur le MainActor pour le Sprint 0/1 (volumes de seed
    /// faibles, aucun impact perceptible). Si la bibliothèque grossit
    /// significativement (voir note de performance dans MatchingEngine),
    /// prévoir de faire porter ce calcul par des DTOs de domaine `Sendable`
    /// plutôt que par les entités SwiftData directement, avant de le
    /// déporter sur une tâche en arrière-plan.
    private func recompute() {
        let descriptor = FetchDescriptor<CocktailEntity>()
        let cocktails = (try? modelContext.fetch(descriptor)) ?? []
        results = matchingEngine.computeMatches(
            availableIngredientIDs: selectedIngredientIDs,
            cocktails: cocktails
        )
    }
}
