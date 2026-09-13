import SwiftUI
import SwiftData
import Observation

/// Représente une ligne d'historique déjà résolue (cocktail + date),
/// pour éviter à la Vue de refaire le lookup par id.
struct HistoryEntryDisplay: Identifiable {
    let id: UUID
    let cocktail: CocktailEntity
    let preparedAt: Date
}

@MainActor
@Observable
final class ProfileViewModel {

    private let modelContext: ModelContext
    var historyEntries: [HistoryEntryDisplay] = []

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func load() {
        let historyDescriptor = FetchDescriptor<HistoryEntryEntity>(
            sortBy: [SortDescriptor(\.preparedAt, order: .reverse)]
        )
        let entries = (try? modelContext.fetch(historyDescriptor)) ?? []

        let cocktailDescriptor = FetchDescriptor<CocktailEntity>()
        let allCocktails = (try? modelContext.fetch(cocktailDescriptor)) ?? []

        historyEntries = entries.compactMap { entry in
            guard let cocktail = allCocktails.first(where: { $0.id == entry.cocktailID }) else {
                return nil
            }
            return HistoryEntryDisplay(id: entry.id, cocktail: cocktail, preparedAt: entry.preparedAt)
        }
    }
}
