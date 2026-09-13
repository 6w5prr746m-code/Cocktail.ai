import Foundation

/// Contrat du moteur de matching — protocolé pour permettre un mock
/// dans les tests des ViewModels (Sprint 2) sans dépendre de l'implémentation
/// réelle ni de SwiftData.
protocol MatchingEngineProtocol {
    /// Calcule, pour chaque cocktail fourni, un score de compatibilité par
    /// rapport aux ingrédients disponibles, et filtre les résultats non
    /// pertinents (voir règles produit dans `MatchingEngine`).
    func computeMatches(
        availableIngredientIDs: Set<UUID>,
        cocktails: [CocktailEntity]
    ) -> [MatchResult]
}
