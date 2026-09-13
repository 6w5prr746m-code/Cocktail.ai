import XCTest
import SwiftData
@testable import CocktailApp

@MainActor
final class RecipeFormViewModelTests: XCTestCase {

    private func makeInMemoryContext() throws -> ModelContext {
        let schema = Schema([
            CocktailEntity.self,
            IngredientEntity.self,
            CocktailIngredientEntity.self,
            RecipeStepEntity.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        return container.mainContext
    }

    func testCreatingARecipeInsertsAUserCreatedCocktail() throws {
        let context = try makeInMemoryContext()
        let viewModel = RecipeFormViewModel(modelContext: context)

        viewModel.name = "Mon Spritz Maison"
        viewModel.category = "Apéritif"
        viewModel.mainSpirit = "Vin"
        viewModel.ingredientRows[0].name = "Prosecco"
        viewModel.ingredientRows[0].quantity = "9"
        viewModel.ingredientRows[0].unit = "cl"
        viewModel.addIngredientRow()
        viewModel.ingredientRows[1].name = "Eau pétillante"
        viewModel.ingredientRows[1].quantity = "3"
        viewModel.ingredientRows[1].unit = "cl"
        viewModel.stepRows[0].instruction = "Verser tous les ingrédients sur glace."

        XCTAssertTrue(viewModel.canSave)
        let savedID = viewModel.save()
        XCTAssertNotNil(savedID)

        let cocktails = try context.fetch(FetchDescriptor<CocktailEntity>())
        XCTAssertEqual(cocktails.count, 1)
        XCTAssertEqual(cocktails[0].name, "Mon Spritz Maison")
        XCTAssertTrue(cocktails[0].isUserCreated)
        XCTAssertEqual(cocktails[0].ingredients.count, 2)
        XCTAssertEqual(cocktails[0].steps.count, 1)
    }

    func testCannotSaveWithoutNameIngredientOrStep() throws {
        let context = try makeInMemoryContext()
        let viewModel = RecipeFormViewModel(modelContext: context)

        // Aucun champ rempli : le formulaire ne doit pas être sauvegardable.
        XCTAssertFalse(viewModel.canSave)
        XCTAssertNil(viewModel.save())

        let cocktails = try context.fetch(FetchDescriptor<CocktailEntity>())
        XCTAssertTrue(cocktails.isEmpty)
    }

    func testEditingAnExistingRecipeReplacesIngredientsAndSteps() throws {
        let context = try makeInMemoryContext()

        // Création initiale.
        let createViewModel = RecipeFormViewModel(modelContext: context)
        createViewModel.name = "Recette initiale"
        createViewModel.ingredientRows[0].name = "Rhum"
        createViewModel.stepRows[0].instruction = "Mélanger."
        guard let cocktailID = createViewModel.save() else {
            XCTFail("La création initiale devrait réussir")
            return
        }

        // Modification : on change le nom et on remplace les ingrédients.
        let editViewModel = RecipeFormViewModel(modelContext: context, existingCocktailID: cocktailID)
        editViewModel.loadIfEditing()
        XCTAssertEqual(editViewModel.name, "Recette initiale")
        XCTAssertTrue(editViewModel.isEditMode)

        editViewModel.name = "Recette modifiée"
        editViewModel.ingredientRows = [.init(name: "Gin", quantity: "5", unit: "cl")]
        editViewModel.save()

        let cocktails = try context.fetch(FetchDescriptor<CocktailEntity>())
        XCTAssertEqual(cocktails.count, 1, "La modification ne doit pas créer un second cocktail")
        XCTAssertEqual(cocktails[0].name, "Recette modifiée")
        XCTAssertEqual(cocktails[0].ingredients.count, 1)
        XCTAssertEqual(cocktails[0].ingredients.first?.ingredient.name, "Gin")
    }
}
