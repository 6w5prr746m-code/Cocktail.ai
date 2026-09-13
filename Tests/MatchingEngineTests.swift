import XCTest
@testable import CocktailApp

final class MatchingEngineTests: XCTestCase {

    private let engine = MatchingEngine()

    // MARK: - Helpers

    private func makeIngredient(_ name: String) -> IngredientEntity {
        IngredientEntity(slug: name.lowercased(), name: name, category: "Alcool")
    }

    private func makeCocktail(
        name: String,
        requiredIngredients: [IngredientEntity],
        optionalIngredients: [IngredientEntity] = []
    ) -> CocktailEntity {
        let cocktail = CocktailEntity(
            name: name,
            category: "Classique",
            difficulty: 1,
            mainSpirit: "Rhum",
            preparationTimeMinutes: 3,
            glassware: "Verre",
            iceType: "Glaçons",
            garnish: "Citron",
            imageURL: "placeholder"
        )
        cocktail.ingredients = requiredIngredients.map {
            CocktailIngredientEntity(ingredient: $0, quantity: 1, unit: "cl", isOptional: false)
        } + optionalIngredients.map {
            CocktailIngredientEntity(ingredient: $0, quantity: 1, unit: "cl", isOptional: true)
        }
        return cocktail
    }

    // MARK: - Tests

    func testFullyAvailableCocktailScoresOneHundredPercent() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let cocktail = makeCocktail(name: "Daiquiri", requiredIngredients: [rhum, citron])

        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id, citron.id],
            cocktails: [cocktail]
        )

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results[0].compatibilityScore, 1.0)
        XCTAssertTrue(results[0].isFullyAvailable)
        XCTAssertTrue(results[0].missingIngredients.isEmpty)
    }

    func testCocktailWithOneMissingIngredientIsIncludedWithCorrectScore() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let angostura = makeIngredient("Angostura")
        let cocktail = makeCocktail(name: "Old Cuban", requiredIngredients: [rhum, citron, angostura])

        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id, citron.id],
            cocktails: [cocktail]
        )

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results[0].missingIngredients.map(\.name), ["Angostura"])
        XCTAssertFalse(results[0].isFullyAvailable)
        XCTAssertEqual(results[0].compatibilityScore, 2.0 / 3.0, accuracy: 0.0001)
    }

    func testCocktailWithThreeOrMoreMissingIngredientsIsExcluded() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let sucre = makeIngredient("Sucre")
        let menthe = makeIngredient("Menthe")
        let cocktail = makeCocktail(
            name: "Mojito",
            requiredIngredients: [rhum, citron, sucre, menthe]
        )

        // Un seul ingrédient possédé sur 4 -> 3 manquants -> exclu.
        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id],
            cocktails: [cocktail]
        )

        XCTAssertTrue(results.isEmpty)
    }

    func testNoIngredientsAvailableExcludesAllCocktails() {
        let rhum = makeIngredient("Rhum")
        let cocktail = makeCocktail(name: "Cuba Libre", requiredIngredients: [rhum, makeIngredient("Coca")])

        let results = engine.computeMatches(availableIngredientIDs: [], cocktails: [cocktail])

        XCTAssertTrue(results.isEmpty)
    }

    func testOptionalIngredientsDoNotAffectScoreOrMissingList() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let menthePourDecor = makeIngredient("Menthe (garniture)")
        let cocktail = makeCocktail(
            name: "Daiquiri",
            requiredIngredients: [rhum, citron],
            optionalIngredients: [menthePourDecor]
        )

        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id, citron.id],   // menthe non possédée
            cocktails: [cocktail]
        )

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results[0].compatibilityScore, 1.0, "Un ingrédient optionnel manquant ne doit pas pénaliser le score")
        XCTAssertTrue(results[0].missingIngredients.isEmpty)
    }

    func testResultsAreSortedByScoreDescendingThenByFewerMissing() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let sucre = makeIngredient("Sucre")

        let cocktailHighScore = makeCocktail(name: "Score élevé", requiredIngredients: [rhum, citron])
        let cocktailLowScore = makeCocktail(name: "Score faible", requiredIngredients: [rhum, citron, sucre])

        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id, citron.id],
            cocktails: [cocktailLowScore, cocktailHighScore]
        )

        XCTAssertEqual(results.first?.cocktail.name, "Score élevé")
    }

    func testCocktailWithoutAnyRequiredIngredientIsExcluded() {
        // Cas de données invalide : un cocktail sans aucun ingrédient
        // obligatoire ne doit pas produire de division par zéro ni de
        // faux score de 100%.
        let cocktail = makeCocktail(name: "Invalide", requiredIngredients: [])

        let results = engine.computeMatches(availableIngredientIDs: [], cocktails: [cocktail])

        XCTAssertTrue(results.isEmpty)
    }
}
