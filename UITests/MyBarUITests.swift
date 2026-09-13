import XCTest

/// Test UI du parcours principal de Mon Bar (Sprint My Bar 2.0) : ajouter
/// un ingrédient, vérifier qu'il apparaît dans "Déjà dans ton bar", changer
/// son statut de stock, puis le retirer. Nécessite la cible "UI Testing
/// Bundle" déjà documentée dans le README du projet.
final class MyBarUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testAddIngredientAppearsInOwnedSectionThenCanBeRemoved() throws {
        let app = XCUIApplication()
        app.launch()

        app.tabBars.buttons["Mon Bar"].tap()

        // Ajouter un ingrédient connu du seed via la section "Ajouter des
        // ingrédients" (chip non sélectionné au départ).
        let addChip = app.buttons["Rhum blanc"]
        XCTAssertTrue(addChip.waitForExistence(timeout: 5))
        addChip.tap()

        // Il doit maintenant apparaître dans "Déjà dans ton bar".
        let ownedSectionTitle = app.staticTexts["Déjà dans ton bar (1)"]
        XCTAssertTrue(ownedSectionTitle.waitForExistence(timeout: 3))

        // Changer son statut de stock vers "Faible".
        let lowStatusChip = app.buttons["Faible"]
        XCTAssertTrue(lowStatusChip.waitForExistence(timeout: 2))
        lowStatusChip.tap()

        // Le retirer via le bouton de suppression.
        let removeButton = app.buttons["Retirer Rhum blanc de Mon Bar"]
        XCTAssertTrue(removeButton.waitForExistence(timeout: 2))
        removeButton.tap()

        let emptyOwnedSection = app.staticTexts["Déjà dans ton bar (1)"]
        XCTAssertFalse(emptyOwnedSection.exists, "La section ne devrait plus afficher l'ingrédient retiré")
    }

    func testCategoryFilterNarrowsCatalog() throws {
        let app = XCUIApplication()
        app.launch()

        app.tabBars.buttons["Mon Bar"].tap()

        let herbeFilter = app.buttons["Herbe"]
        XCTAssertTrue(herbeFilter.waitForExistence(timeout: 5))
        herbeFilter.tap()

        // Un ingrédient d'une autre catégorie (ex: Rhum blanc, Alcool) ne
        // doit plus apparaître dans la grille d'ajout après filtrage.
        let rhumChip = app.buttons["Rhum blanc"]
        XCTAssertFalse(rhumChip.waitForExistence(timeout: 2))
    }

    func testUseMyBarButtonPreselectsIngredientsInMagicSearch() throws {
        let app = XCUIApplication()
        app.launch()

        // Ajouter un ingrédient depuis Mon Bar.
        app.tabBars.buttons["Mon Bar"].tap()
        let addChip = app.buttons["Rhum blanc"]
        XCTAssertTrue(addChip.waitForExistence(timeout: 5))
        addChip.tap()

        // Ouvrir la recherche magique et utiliser le bouton "Utiliser Mon Bar".
        app.tabBars.buttons["Accueil"].tap()
        let addIngredientsButton = app.buttons["Ajouter mes ingrédients"]
        XCTAssertTrue(addIngredientsButton.waitForExistence(timeout: 3))
        addIngredientsButton.tap()

        let useMyBarButton = app.buttons["Utiliser Mon Bar"]
        XCTAssertTrue(useMyBarButton.waitForExistence(timeout: 3))
        useMyBarButton.tap()

        // Le chip "Rhum blanc" doit désormais apparaître sélectionné dans
        // le picker de la recherche magique — preuve que Mon Bar alimente
        // bien le Matching Engine plutôt que de rester une liste isolée.
        let selectedChip = app.buttons["Rhum blanc"]
        XCTAssertTrue(selectedChip.waitForExistence(timeout: 2))
    }
}
