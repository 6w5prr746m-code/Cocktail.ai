import SwiftData
import Foundation

/// Représente une préparation effective d'un cocktail par l'utilisateur.
/// Voir le commentaire d'architecture dans `FavoriteEntity.swift` : même
/// raisonnement ici — `cocktailID` en UUID simple plutôt qu'en relation,
/// car cette entité est synchronisée CloudKit et `CocktailEntity` ne l'est pas.
@Model
final class HistoryEntryEntity {
    var id: UUID
    var cocktailID: UUID
    var preparedAt: Date
    var rating: Int?   // 1 à 5, optionnel

    init(id: UUID = UUID(), cocktailID: UUID, rating: Int? = nil) {
        self.id = id
        self.cocktailID = cocktailID
        self.preparedAt = .now
        self.rating = rating
    }
}
