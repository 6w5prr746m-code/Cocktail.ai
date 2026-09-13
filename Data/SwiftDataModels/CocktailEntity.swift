import SwiftData
import Foundation

@Model
final class CocktailEntity {
    @Attribute(.unique) var id: UUID
    var name: String
    var category: String            // ex: "Classique", "Tiki", "Sans alcool"
    var origin: String?
    var history: String?
    var difficulty: Int              // 1 (facile) à 3 (difficile)
    var mainSpirit: String
    var preparationTimeMinutes: Int
    var glassware: String
    var iceType: String
    var garnish: String
    var tips: String?
    var imageURL: String
    var isUserCreated: Bool
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \CocktailIngredientEntity.cocktail)
    var ingredients: [CocktailIngredientEntity]

    @Relationship(deleteRule: .cascade, inverse: \RecipeStepEntity.cocktail)
    var steps: [RecipeStepEntity]

    // Variantes : relation simple, non-inverse pour éviter les cycles de
    // suppression en cascade entre cocktails liés.
    var variants: [CocktailEntity]

    init(
        id: UUID = UUID(),
        name: String,
        category: String,
        origin: String? = nil,
        history: String? = nil,
        difficulty: Int,
        mainSpirit: String,
        preparationTimeMinutes: Int,
        glassware: String,
        iceType: String,
        garnish: String,
        tips: String? = nil,
        imageURL: String,
        isUserCreated: Bool = false
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.origin = origin
        self.history = history
        self.difficulty = difficulty
        self.mainSpirit = mainSpirit
        self.preparationTimeMinutes = preparationTimeMinutes
        self.glassware = glassware
        self.iceType = iceType
        self.garnish = garnish
        self.tips = tips
        self.imageURL = imageURL
        self.isUserCreated = isUserCreated
        self.createdAt = .now
        self.ingredients = []
        self.steps = []
        self.variants = []
    }
}
