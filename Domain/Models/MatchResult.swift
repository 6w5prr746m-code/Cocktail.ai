import Foundation

/// Résultat du moteur de matching pour un cocktail donné, au regard des
/// ingrédients disponibles. Modèle de domaine pur (pas de dépendance
/// SwiftData) pour rester facilement testable et réutilisable en dehors
/// du contexte de persistance.
struct MatchResult: Identifiable, Equatable {
    let id: UUID
    let cocktail: CocktailEntity
    /// Score de 0.0 à 1.0 — proportion d'ingrédients obligatoires déjà possédés.
    let compatibilityScore: Double
    /// Ingrédients obligatoires manquants (0, 1 ou 2 maximum — voir règle
    /// produit : on n'affiche pas les cocktails à 3+ ingrédients manquants).
    let missingIngredients: [IngredientEntity]
    let isFullyAvailable: Bool

    static func == (lhs: MatchResult, rhs: MatchResult) -> Bool {
        lhs.id == rhs.id && lhs.compatibilityScore == rhs.compatibilityScore
    }
}
