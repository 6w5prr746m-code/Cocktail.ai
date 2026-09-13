import Foundation

/// Une substitution possible, déjà résolue en value object pur — le
/// Matching Engine ne connaît jamais `IngredientSubstitutionEntity`
/// directement (pas de dépendance SwiftData dans l'algorithme), il reçoit
/// une liste de `SubstitutionOption` déjà chargée par l'appelant.
struct SubstitutionOption: Identifiable, Equatable {
    var id: String { "\(sourceIngredientID)->\(substituteIngredientID)" }

    /// L'ingrédient manquant que cette substitution peut couvrir.
    let sourceIngredientID: UUID
    /// L'ingrédient de remplacement.
    let substituteIngredientID: UUID
    let substituteIngredientName: String
    /// Facteur de dégradation du score, de 0.0 (inutilisable) à 1.0
    /// (équivalent parfait) — jamais négatif, jamais supérieur à 1.
    let degradationFactor: Double
}
