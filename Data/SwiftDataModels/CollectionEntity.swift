import SwiftData
import Foundation

@Model
final class CollectionEntity {
    @Attribute(.unique) var id: UUID
    var name: String
    var iconName: String
    var cocktails: [CocktailEntity]

    init(
        id: UUID = UUID(),
        name: String,
        iconName: String,
        cocktails: [CocktailEntity] = []
    ) {
        self.id = id
        self.name = name
        self.iconName = iconName
        self.cocktails = cocktails
    }
}
