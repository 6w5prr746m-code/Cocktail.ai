import SwiftData
import Foundation

@Model
final class IngredientEntity {
    @Attribute(.unique) var id: UUID
    @Attribute(.unique) var slug: String   // clé stable pour le mapping JSON (ex: "rhum_blanc")
    var name: String
    var category: String   // "Alcool", "Jus", "Sirop", "Garniture", "Autre"
    var colorHex: String?

    init(
        id: UUID = UUID(),
        slug: String,
        name: String,
        category: String,
        colorHex: String? = nil
    ) {
        self.id = id
        self.slug = slug
        self.name = name
        self.category = category
        self.colorHex = colorHex
    }
}
