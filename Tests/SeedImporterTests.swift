import XCTest
import SwiftData
@testable import CocktailApp

@MainActor
final class SeedImporterTests: XCTestCase {

    func testImportSeedPopulatesModelContainer() async throws {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let context = container.mainContext

        let importer = SeedImporter()
        await importer.importIfNeeded(into: context)

        let cocktailCount = try context.fetchCount(FetchDescriptor<CocktailEntity>())
        XCTAssertGreaterThan(cocktailCount, 0, "Le seed devrait importer au moins un cocktail")

        // Vérifie qu'un ingrédient partagé entre plusieurs cocktails
        // (ex: "rhum_blanc") n'est créé qu'une seule fois.
        let ingredientDescriptor = FetchDescriptor<IngredientEntity>(
            predicate: #Predicate { $0.slug == "rhum_blanc" }
        )
        let matchingIngredients = try context.fetch(ingredientDescriptor)
        XCTAssertEqual(matchingIngredients.count, 1, "L'ingrédient 'rhum_blanc' ne doit pas être dupliqué")
    }

    func testImportIsIdempotent() async throws {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let context = container.mainContext

        let importer = SeedImporter()
        await importer.importIfNeeded(into: context)
        let firstCount = try context.fetchCount(FetchDescriptor<CocktailEntity>())

        // Un second appel ne doit rien importer de plus (base déjà peuplée).
        await importer.importIfNeeded(into: context)
        let secondCount = try context.fetchCount(FetchDescriptor<CocktailEntity>())

        XCTAssertEqual(firstCount, secondCount, "Un second import ne doit pas dupliquer les données")
    }

    func testCollectionsAreImportedAndReferenceRealCocktails() async throws {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self,
            CollectionEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let context = container.mainContext

        let importer = SeedImporter()
        await importer.importIfNeeded(into: context)

        let collections = try context.fetch(FetchDescriptor<CollectionEntity>())
        XCTAssertGreaterThan(collections.count, 0, "Au moins une collection devrait être importée")

        // Chaque collection importée doit contenir au moins un cocktail
        // réel (voir la garde dans importCollections qui exclut les
        // collections dont aucun nom ne correspond).
        for collection in collections {
            XCTAssertFalse(collection.cocktails.isEmpty, "La collection '\(collection.name)' ne devrait pas être vide")
        }
    }

    func testSubstitutionsAreImportedAndReferenceRealIngredients() async throws {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self,
            IngredientSubstitutionEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let context = container.mainContext

        let importer = SeedImporter()
        await importer.importIfNeeded(into: context)

        let substitutions = try context.fetch(FetchDescriptor<IngredientSubstitutionEntity>())
        XCTAssertGreaterThan(substitutions.count, 0, "Au moins une substitution devrait être importée")

        let ingredients = try context.fetch(FetchDescriptor<IngredientEntity>())
        let ingredientIDs = Set(ingredients.map(\.id))

        for substitution in substitutions {
            XCTAssertTrue(ingredientIDs.contains(substitution.sourceIngredientID), "L'ingrédient source doit exister dans le référentiel")
            XCTAssertTrue(ingredientIDs.contains(substitution.substituteIngredientID), "L'ingrédient substitut doit exister dans le référentiel")
            XCTAssertGreaterThan(substitution.degradationFactor, 0)
            XCTAssertLessThanOrEqual(substitution.degradationFactor, 1)
        }
    }
}
