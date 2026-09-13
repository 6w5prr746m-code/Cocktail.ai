import SwiftUI
import SwiftData
import Observation

/// ViewModel de la fiche cocktail. Charge le cocktail par son id plutôt
/// que de recevoir directement l'entité, pour rester cohérent avec la
/// navigation par `AppNavigation.Destination.cocktailDetail(id:)` — utile
/// pour les deep links (QR code, widget) qui ne transportent qu'un UUID.
@MainActor
@Observable
final class CocktailDetailViewModel {

    private let modelContext: ModelContext
    let cocktailID: UUID

    var cocktail: CocktailEntity?
    var isFavorite: Bool = false

    /// Distingue "en cours de chargement" de "introuvable" — les deux
    /// donnent `cocktail == nil`, mais doivent s'afficher différemment.
    /// Devient pertinent avec le deep linking (Sprint 12) : un lien
    /// périmé (widget mis en cache la veille, recette perso depuis
    /// supprimée) ne doit pas laisser un spinner tourner indéfiniment.
    private(set) var hasAttemptedLoad = false

    init(cocktailID: UUID, modelContext: ModelContext) {
        self.cocktailID = cocktailID
        self.modelContext = modelContext
    }

    func load() {
        let descriptor = FetchDescriptor<CocktailEntity>(
            predicate: #Predicate { $0.id == cocktailID }
        )
        cocktail = try? modelContext.fetch(descriptor).first
        hasAttemptedLoad = true

        let favoriteDescriptor = FetchDescriptor<FavoriteEntity>()
        let favorites = (try? modelContext.fetch(favoriteDescriptor)) ?? []
        isFavorite = favorites.contains { $0.cocktailID == cocktailID }
    }

    /// Bascule l'état favori (persisté et synchronisé via CloudKit — voir
    /// AppContainer et FavoriteEntity pour le détail de cette séparation).
    func toggleFavorite() {
        guard cocktail != nil else { return }

        if isFavorite {
            let descriptor = FetchDescriptor<FavoriteEntity>()
            if let existing = (try? modelContext.fetch(descriptor))?.first(where: { $0.cocktailID == cocktailID }) {
                modelContext.delete(existing)
            }
        } else {
            let favorite = FavoriteEntity(cocktailID: cocktailID)
            modelContext.insert(favorite)
        }

        try? modelContext.save()
        isFavorite.toggle()
    }
}
