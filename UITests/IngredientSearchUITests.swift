import XCTest

/// Test UI du parcours critique le plus important de l'app : sélectionner
/// des ingrédients et obtenir un résultat de la recherche magique
/// (US-A1 à US-A3). Nécessite une cible "UI Testing Bundle" séparée —
/// voir README pour la configuration Xcode.
final class IngredientSearchUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSelectingThreeIngredientsShowsResults() throws {
        let app = XCUIApplication()
        app.launch()

        // Attendre le chargement du seed (import au premier lancement).
        let addIngredientsButton = app.buttons["Ajouter mes ingrédients"]
        XCTAssertTrue(addIngredientsButton.waitForExistence(timeout: 5))
        addIngredientsButton.tap()

        // Sélectionner 3 ingrédients connus du seed de démonstration.
        for ingredientName in ["Rhum blanc", "Citron vert", "Menthe fraîche"] {
            let chip = app.buttons[ingredientName]
            XCTAssertTrue(chip.waitForExistence(timeout: 3), "Le chip '\(ingredientName)' devrait exister")
            chip.tap()
        }

        // Le Mojito (100% de compatibilité) devrait apparaître dans les résultats.
        let mojitoResult = app.staticTexts["Mojito"]
        XCTAssertTrue(mojitoResult.waitForExistence(timeout: 3), "Le Mojito devrait apparaître dans les résultats")
    }

    func testFewerThanThreeIngredientsShowsPrompt() throws {
        let app = XCUIApplication()
        app.launch()

        let addIngredientsButton = app.buttons["Ajouter mes ingrédients"]
        XCTAssertTrue(addIngredientsButton.waitForExistence(timeout: 5))
        addIngredientsButton.tap()

        let chip = app.buttons["Rhum blanc"]
        XCTAssertTrue(chip.waitForExistence(timeout: 3))
        chip.tap()

        // Avec un seul ingrédient sélectionné, le message d'invite doit
        // rester visible (règle produit : minimum 3 ingrédients).
        let prompt = app.staticTexts["Encore 2 ingrédient(s)"]
        XCTAssertTrue(prompt.waitForExistence(timeout: 2))
    }
}
