import SwiftData
import Foundation

@Model
final class RecipeStepEntity {
    @Attribute(.unique) var id: UUID
    var cocktail: CocktailEntity?
    var order: Int
    var instruction: String
    var durationSeconds: Int?   // nil si l'étape n'a pas de minuteur

    init(
        id: UUID = UUID(),
        order: Int,
        instruction: String,
        durationSeconds: Int? = nil
    ) {
        self.id = id
        self.order = order
        self.instruction = instruction
        self.durationSeconds = durationSeconds
    }
}
