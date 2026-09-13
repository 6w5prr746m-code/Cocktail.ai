import XCTest
import SwiftData
@testable import CocktailApp

/// Ces tests utilisent une configuration locale en mémoire (pas de
/// CloudKit — impossible à simuler en test unitaire). Ils valident surtout
/// que le choix de `cocktailID: UUID` plutôt qu'une relation directe
/// fonctionne comme prévu pour retrouver le bon cocktail.
@MainActor
final class FavoriteAndHistoryTests: XCTestCase {

    private func makeInMemoryContext() throws -> ModelContext {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self,
            FavoriteEntity.self,
            HistoryEntryEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        return container.mainContext
    }

    func testFavoriteCanBeResolvedBackToItsCocktail() throws {
        let context = try makeInMemoryContext()

        let cocktail = CocktailEntity(
            name: "Mojito", category: "Classique", difficulty: 1,
            mainSpirit: "Rhum", preparationTimeMinutes: 4,
            glassware: "Highball", iceType: "Pilée", garnish: "Menthe",
            imageURL: "placeholder"
        )
        context.insert(cocktail)

        let favorite = FavoriteEntity(cocktailID: cocktail.id)
        context.insert(favorite)
        try context.save()

        let favorites = try context.fetch(FetchDescriptor<FavoriteEntity>())
        XCTAssertEqual(favorites.count, 1)

        let cocktails = try context.fetch(FetchDescriptor<CocktailEntity>())
        let resolved = cocktails.first { $0.id == favorites[0].cocktailID }
        XCTAssertEqual(resolved?.name, "Mojito")
    }

    func testHistoryEntryRecordsPreparationDate() throws {
        let context = try makeInMemoryContext()

        let cocktail = CocktailEntity(
            name: "Daiquiri", category: "Classique", difficulty: 2,
            mainSpirit: "Rhum", preparationTimeMinutes: 3,
            glassware: "Cocktail", iceType: "Aucune", garnish: "Zeste",
            imageURL: "placeholder"
        )
        context.insert(cocktail)

        let entry = HistoryEntryEntity(cocktailID: cocktail.id)
        context.insert(entry)
        try context.save()

        let entries = try context.fetch(FetchDescriptor<HistoryEntryEntity>())
        XCTAssertEqual(entries.count, 1)
        XCTAssertEqual(entries[0].cocktailID, cocktail.id)
        XCTAssertNil(entries[0].rating)
    }
}
