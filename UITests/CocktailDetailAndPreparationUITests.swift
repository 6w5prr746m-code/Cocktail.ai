import XCTest

/// Test UI du parcours fiche cocktail → mode préparation (US-C1), le
/// second parcours critique identifié au plan de sprints.
final class CocktailDetailAndPreparationUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testOpeningACocktailAndStartingPreparation() throws {
        let app = XCUIApplication()
        app.launch()

        // Depuis l'accueil, ouvrir le premier cocktail de la section Populaires.
        let firstCocktailCard = app.buttons.matching(identifier: "Mojito").firstMatch
        XCTAssertTrue(firstCocktailCard.waitForExistence(timeout: 5))
        firstCocktailCard.tap()

        let prepareButton = app.buttons["Préparer"]
        XCTAssertTrue(prepareButton.waitForExistence(timeout: 3))
        prepareButton.tap()

        // Le mode préparation doit afficher la première étape.
        let stepIndicator = app.staticTexts["1 / 5"]
        XCTAssertTrue(stepIndicator.waitForExistence(timeout: 3), "Le Mojito a 5 étapes dans le seed de démonstration")
    }

    func testFavoriteButtonTogglesState() throws {
        let app = XCUIApplication()
        app.launch()

        let firstCocktailCard = app.buttons.matching(identifier: "Daiquiri").firstMatch
        XCTAssertTrue(firstCocktailCard.waitForExistence(timeout: 5))
        firstCocktailCard.tap()

        let favoriteButton = app.navigationBars.buttons.matching(identifier: "heart").firstMatch
        XCTAssertTrue(favoriteButton.waitForExistence(timeout: 3))
        favoriteButton.tap()

        // Après le tap, l'icône doit basculer vers l'état rempli.
        let filledFavoriteButton = app.navigationBars.buttons.matching(identifier: "heart.fill").firstMatch
        XCTAssertTrue(filledFavoriteButton.waitForExistence(timeout: 2))
    }
}
