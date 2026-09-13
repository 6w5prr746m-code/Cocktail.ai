import SwiftData
import Foundation

@Model
final class CocktailIngredientEntity {
    @Attribute(.unique) var id: UUID
    var cocktail: CocktailEntity?
    var ingredient: IngredientEntity
    var quantity: Double
    var unit: String        // "ml", "cl", "trait", "feuilles", "pièce"
    var isOptional: Bool
    /// Rôle de cet ingrédient *dans cette recette précise* — voir
    /// `IngredientRole` (Sprint Matching Engine V2). Valeur par défaut
    /// `.modifier` pour que tous les appels existants (seed importé avant
    /// ce sprint, tests V1) continuent de compiler et de se comporter à
    /// l'identique sans modification.
    var role: IngredientRole = IngredientRole.modifier

    init(
        id: UUID = UUID(),
        ingredient: IngredientEntity,
        quantity: Double,
        unit: String,
        isOptional: Bool = false,
        role: IngredientRole = .modifier
    ) {
        self.id = id
        self.ingredient = ingredient
        self.quantity = quantity
        self.unit = unit
        self.isOptional = isOptional
        self.role = role
    }
}
