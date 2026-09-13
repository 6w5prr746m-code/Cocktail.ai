import XCTest
import SwiftData
@testable import CocktailApp

@MainActor
final class MyBarViewModelTests: XCTestCase {

    private func makeInMemoryContext() throws -> ModelContext {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self,
            UserIngredientEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        return container.mainContext
    }

    /// Construit un mini-catalogue + un cocktail simple, pour tester à la
    /// fois le CRUD de Mon Bar et son intégration avec le Matching Engine
    /// sans dépendre du seed JSON réel.
    private func makeFixture(in context: ModelContext) -> (rhum: IngredientEntity, citron: IngredientEntity, menthe: IngredientEntity) {
        let rhum = IngredientEntity(slug: "rhum_blanc", name: "Rhum blanc", category: "Alcool")
        let citron = IngredientEntity(slug: "citron_vert", name: "Citron vert", category: "Fruit")
        let menthe = IngredientEntity(slug: "menthe", name: "Menthe", category: "Herbe")
        [rhum, citron, menthe].forEach { context.insert($0) }

        let mojito = CocktailEntity(
            name: "Mojito", category: "Classique", difficulty: 1,
            mainSpirit: "Rhum", preparationTimeMinutes: 4,
            glassware: "Highball", iceType: "Pilée", garnish: "Menthe",
            imageURL: "placeholder"
        )
        context.insert(mojito)
        for ingredient in [rhum, citron, menthe] {
            let link = CocktailIngredientEntity(ingredient: ingredient, quantity: 1, unit: "cl")
            link.cocktail = mojito
            context.insert(link)
        }

        return (rhum, citron, menthe)
    }

    // MARK: - CRUD de base

    func testAddIngredientAppearsInMyBarEntries() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        viewModel.add(rhum)

        XCTAssertEqual(viewModel.myBarEntries.count, 1)
        XCTAssertTrue(viewModel.ownedIngredientIDs.contains(rhum.id))
    }

    func testAddingSameIngredientTwiceDoesNotDuplicate() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        viewModel.add(rhum)
        viewModel.add(rhum)

        XCTAssertEqual(viewModel.myBarEntries.count, 1)
    }

    func testRemoveIngredientDeletesEntry() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()
        viewModel.add(rhum)

        viewModel.remove(rhum)

        XCTAssertTrue(viewModel.myBarEntries.isEmpty)
    }

    func testToggleAddsThenRemoves() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        viewModel.toggle(rhum)
        XCTAssertEqual(viewModel.myBarEntries.count, 1)

        viewModel.toggle(rhum)
        XCTAssertEqual(viewModel.myBarEntries.count, 0)
    }

    // MARK: - Statut de stock et quantité approximative

    func testUpdateStockStatusPersists() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()
        viewModel.add(rhum)

        viewModel.updateStockStatus(rhum, to: .almostEmpty)

        XCTAssertEqual(viewModel.myBarEntries.first?.entry.stockStatus, .almostEmpty)
    }

    func testUpdateApproximateQuantityPersists() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()
        viewModel.add(rhum)

        viewModel.updateApproximateQuantity(rhum, to: "environ 1 bouteille")

        XCTAssertEqual(viewModel.myBarEntries.first?.entry.approximateQuantity, "environ 1 bouteille")
    }

    func testEmptyApproximateQuantityIsStoredAsNil() throws {
        let context = try makeInMemoryContext()
        let (rhum, _, _) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()
        viewModel.add(rhum)
        viewModel.updateApproximateQuantity(rhum, to: "quelque chose")

        viewModel.updateApproximateQuantity(rhum, to: "")

        XCTAssertNil(viewModel.myBarEntries.first?.entry.approximateQuantity)
    }

    // MARK: - Recherche et filtre par catégorie

    func testSearchFiltersCatalog() throws {
        let context = try makeInMemoryContext()
        _ = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        viewModel.searchText = "citron"

        XCTAssertEqual(viewModel.filteredCatalog.map(\.name), ["Citron vert"])
    }

    func testCategoryFilterRestrictsCatalog() throws {
        let context = try makeInMemoryContext()
        _ = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        viewModel.selectedCategory = "Herbe"

        XCTAssertEqual(viewModel.filteredCatalog.map(\.name), ["Menthe"])
    }

    func testAvailableCategoriesAreDerivedFromCatalogNotHardcoded() throws {
        let context = try makeInMemoryContext()
        _ = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        XCTAssertEqual(viewModel.availableCategories, ["Alcool", "Fruit", "Herbe"])
    }

    // MARK: - Intégration avec le Matching Engine (le cœur du sprint)

    func testUnlockedCocktailCountReflectsMatchingEngine() throws {
        let context = try makeInMemoryContext()
        let (rhum, citron, menthe) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        XCTAssertEqual(viewModel.unlockedCocktailCount, 0, "Bar vide : aucun cocktail débloqué")

        viewModel.add(rhum)
        viewModel.add(citron)
        viewModel.add(menthe)

        XCTAssertEqual(viewModel.unlockedCocktailCount, 1, "Les 3 ingrédients du Mojito sont réunis")
    }

    func testBarReadinessReflectsUnlockedCount() throws {
        let context = try makeInMemoryContext()
        let (rhum, citron, menthe) = makeFixture(in: context)
        let viewModel = MyBarViewModel(modelContext: context, matchingEngine: MatchingEngine())
        viewModel.load()

        XCTAssertEqual(viewModel.barReadiness.title, BarReadiness.empty.title)

        viewModel.add(rhum)
        XCTAssertEqual(viewModel.barReadiness.title, BarReadiness.almostReady.title)

        viewModel.add(citron)
        viewModel.add(menthe)
        XCTAssertEqual(viewModel.barReadiness.title, BarReadiness.almostReady.title, "1 cocktail débloqué < seuil excellent")
    }
}
