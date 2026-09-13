import SwiftUI
import SwiftData
import Observation

/// ViewModel de l'onglet Favoris (US-D3).
@MainActor
@Observable
final class FavoritesViewModel {

    private let modelContext: ModelContext
    var favoriteCocktails: [CocktailEntity] = []

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func load() {
        let favoriteDescriptor = FetchDescriptor<FavoriteEntity>(
            sortBy: [SortDescriptor(\.addedAt, order: .reverse)]
        )
        let favorites = (try? modelContext.fetch(favoriteDescriptor)) ?? []

        let cocktailDescriptor = FetchDescriptor<CocktailEntity>()
        let allCocktails = (try? modelContext.fetch(cocktailDescriptor)) ?? []

        // Résolution manuelle par id : voir le raisonnement dans
        // FavoriteEntity.swift (deux configurations SwiftData distinctes).
        favoriteCocktails = favorites.compactMap { favorite in
            allCocktails.first { $0.id == favorite.cocktailID }
        }
    }

    func removeFavorite(_ cocktail: CocktailEntity) {
        let descriptor = FetchDescriptor<FavoriteEntity>()
        if let existing = (try? modelContext.fetch(descriptor))?.first(where: { $0.cocktailID == cocktail.id }) {
            modelContext.delete(existing)
            try? modelContext.save()
        }
        load()
    }
}
