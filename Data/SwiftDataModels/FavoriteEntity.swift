import SwiftData
import Foundation

/// Représente un cocktail ajouté aux favoris par l'utilisateur.
///
/// Point d'architecture important (voir Architecture Technique §6) : cette
/// entité est synchronisée via CloudKit (données personnelles), alors que
/// `CocktailEntity` (la bibliothèque de référence) reste 100% locale et
/// non synchronisée. Or CloudKit impose deux contraintes à toute entité
/// synchronisée :
///   1. Aucun attribut `@Attribute(.unique)` n'est autorisé.
///   2. Les relations doivent rester dans le même groupe de synchronisation.
/// Comme `CocktailEntity` n'est justement PAS dans ce groupe, on ne peut
/// pas avoir de `@Relationship` direct vers lui. On stocke donc son `id`
/// comme simple `UUID`, et on résout le cocktail correspondant via une
/// requête `FetchDescriptor` côté ViewModel quand nécessaire.
@Model
final class FavoriteEntity {
    var id: UUID
    var cocktailID: UUID
    var addedAt: Date

    init(id: UUID = UUID(), cocktailID: UUID) {
        self.id = id
        self.cocktailID = cocktailID
        self.addedAt = .now
    }
}
