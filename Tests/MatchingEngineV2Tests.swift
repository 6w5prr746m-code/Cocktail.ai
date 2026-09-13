import XCTest
@testable import CocktailApp

final class MatchingEngineV2Tests: XCTestCase {

    private let engine = MatchingEngine()

    // MARK: - Helpers

    private func makeIngredient(_ name: String) -> IngredientEntity {
        IngredientEntity(slug: name.lowercased(), name: name, category: "Test")
    }

    private func makeCocktail(
        name: String,
        links: [CocktailIngredientEntity],
        variants: [CocktailEntity] = []
    ) -> CocktailEntity {
        let cocktail = CocktailEntity(
            name: name,
            category: "Test",
            difficulty: 1,
            mainSpirit: "Test",
            preparationTimeMinutes: 3,
            glassware: "Verre",
            iceType: "Glaçons",
            garnish: "Aucune",
            imageURL: "placeholder"
        )
        cocktail.ingredients = links
        cocktail.variants = variants
        return cocktail
    }

    private func link(
        _ ingredient: IngredientEntity,
        role: IngredientRole,
        isOptional: Bool = false
    ) -> CocktailIngredientEntity {
        CocktailIngredientEntity(ingredient: ingredient, quantity: 1, unit: "cl", isOptional: isOptional, role: role)
    }

    // MARK: - Alcool principal manquant

    func testMissingPrimarySpiritCausesLargeScoreDrop() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let cocktail = makeCocktail(name: "Test1", links: [
            link(rhum, role: .primarySpirit),
            link(citron, role: .modifier)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [citron.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results.count, 1)
        // (0*1.0 + 1*0.6) / (1.0 + 0.6) = 0.375
        XCTAssertEqual(results[0].compatibilityScore, 0.375, accuracy: 0.0001)
        XCTAssertEqual(results[0].missingIngredients.map(\.name), ["Rhum"])
        if case .missingFew = results[0].availability {} else { XCTFail("Devrait être .missingFew") }
    }

    // MARK: - Garniture manquante

    func testMissingGarnishHasSmallScoreImpact() {
        let rhum = makeIngredient("Rhum")
        let menthe = makeIngredient("Menthe")
        let cocktail = makeCocktail(name: "Test2", links: [
            link(rhum, role: .primarySpirit),
            link(menthe, role: .garnish)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        // (1*1.0 + 0*0.15) / (1.0 + 0.15) ≈ 0.8696 — score élevé malgré un
        // ingrédient manquant, contrairement à l'alcool principal manquant.
        XCTAssertEqual(results[0].compatibilityScore, 1.0 / 1.15, accuracy: 0.0001)
        XCTAssertGreaterThan(results[0].compatibilityScore, 0.85)
    }

    // MARK: - Ingrédient optionnel

    func testOptionalIngredientNeverAffectsScoreWhenAbsent() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let cocktail = makeCocktail(name: "Test3", links: [
            link(rhum, role: .primarySpirit),
            link(citron, role: .modifier, isOptional: true)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results[0].compatibilityScore, 1.0)
        if case .ready = results[0].availability {} else { XCTFail("Devrait être .ready") }
    }

    func testOptionalIngredientPresentAppearsAsBonusNotAsScoreBoost() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let cocktail = makeCocktail(name: "Test4", links: [
            link(rhum, role: .primarySpirit),
            link(citron, role: .modifier, isOptional: true)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .available, citron.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results[0].compatibilityScore, 1.0, "Le score ne change pas, avec ou sans l'optionnel")
        XCTAssertEqual(results[0].explanation.bonusOptionalIngredientsPresent.map(\.name), ["Citron"])
    }

    // MARK: - Substitution

    func testSubstitutionAppliedWhenDirectIngredientMissing() {
        let siropSucre = makeIngredient("Sirop de sucre")
        let sucreCanne = makeIngredient("Sucre de canne")
        let cocktail = makeCocktail(name: "Test5", links: [
            link(siropSucre, role: .modifier)
        ])
        let substitution = SubstitutionOption(
            sourceIngredientID: siropSucre.id,
            substituteIngredientID: sucreCanne.id,
            substituteIngredientName: "Sucre de canne",
            degradationFactor: 0.85
        )

        let results = engine.computeAdvancedMatches(
            inventory: [sucreCanne.id: .available],
            cocktails: [cocktail],
            substitutions: [substitution]
        )

        XCTAssertEqual(results[0].compatibilityScore, 0.85, accuracy: 0.0001)
        XCTAssertTrue(results[0].missingIngredients.isEmpty, "Couvert par substitution, pas 'manquant'")
        XCTAssertEqual(results[0].explanation.degradedIngredients.count, 1)
        if case .substitution(let option) = results[0].explanation.degradedIngredients[0].reason {
            XCTAssertEqual(option.substituteIngredientID, sucreCanne.id)
        } else {
            XCTFail("La raison de dégradation devrait être une substitution")
        }
    }

    func testBestSubstitutionIsChosenAmongMultipleCandidates() {
        let source = makeIngredient("Source")
        let weakSub = makeIngredient("Faible")
        let strongSub = makeIngredient("Fort")
        let cocktail = makeCocktail(name: "Test6", links: [link(source, role: .modifier)])

        let substitutions = [
            SubstitutionOption(sourceIngredientID: source.id, substituteIngredientID: weakSub.id, substituteIngredientName: "Faible", degradationFactor: 0.3),
            SubstitutionOption(sourceIngredientID: source.id, substituteIngredientID: strongSub.id, substituteIngredientName: "Fort", degradationFactor: 0.9)
        ]

        let results = engine.computeAdvancedMatches(
            inventory: [weakSub.id: .available, strongSub.id: .available],
            cocktails: [cocktail],
            substitutions: substitutions
        )

        XCTAssertEqual(results[0].compatibilityScore, 0.9, accuracy: 0.0001, "Doit choisir la meilleure substitution disponible")
    }

    // MARK: - Quantité insuffisante (statut de stock)

    func testLowStockDegradesScoreButIsNotTreatedAsMissing() {
        let rhum = makeIngredient("Rhum")
        let cocktail = makeCocktail(name: "Test7", links: [link(rhum, role: .primarySpirit)])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .low],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results[0].compatibilityScore, 0.75, accuracy: 0.0001)
        XCTAssertTrue(results[0].missingIngredients.isEmpty)
        XCTAssertEqual(results[0].explanation.degradedIngredients.first?.reason, .lowStock)
    }

    func testAlmostEmptyStockDegradesScoreMoreThanLowStock() {
        let rhum = makeIngredient("Rhum")
        let cocktail = makeCocktail(name: "Test8", links: [link(rhum, role: .primarySpirit)])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .almostEmpty],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results[0].compatibilityScore, 0.4, accuracy: 0.0001)
        XCTAssertEqual(results[0].explanation.degradedIngredients.first?.reason, .almostEmptyStock)
    }

    func testDegradedIngredientsDoNotCountTowardExclusionThreshold() {
        // 3 ingrédients requis, tous en stock faible (donc satisfaction >
        // 0 mais < 1) : aucun n'est "manquant" au sens strict, le cocktail
        // ne doit donc PAS être exclu même si le seuil V1 (2 manquants max)
        // aurait pu laisser croire le contraire s'il s'appliquait au
        // nombre total d'ingrédients imparfaits plutôt qu'au nombre
        // d'ingrédients à satisfaction strictement nulle.
        let a = makeIngredient("A")
        let b = makeIngredient("B")
        let c = makeIngredient("C")
        let cocktail = makeCocktail(name: "Test9", links: [
            link(a, role: .modifier), link(b, role: .modifier), link(c, role: .modifier)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [a.id: .low, b.id: .low, c.id: .low],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertEqual(results.count, 1, "Ne doit pas être exclu : aucun ingrédient n'est totalement manquant")
    }

    // MARK: - Variante

    func testVariantAvailabilityComputedIndependentlyFromMainCocktail() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")

        let variant = makeCocktail(name: "Variante", links: [link(rhum, role: .primarySpirit)])
        let main = makeCocktail(
            name: "Principal",
            links: [link(rhum, role: .primarySpirit), link(citron, role: .modifier)],
            variants: [variant]
        )

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .available],
            cocktails: [main],
            substitutions: []
        )

        XCTAssertEqual(results[0].realizableVariants.count, 1)
        XCTAssertTrue(results[0].realizableVariants[0].isFullyAvailable)
        XCTAssertEqual(results[0].realizableVariants[0].compatibilityScore, 1.0)
        XCTAssertLessThan(results[0].compatibilityScore, 1.0, "Le principal, lui, manque le citron")
    }

    // MARK: - Cocktail sans alcool

    func testMocktailWithoutPrimarySpiritScoresNormallyWithoutSpecialCasing() {
        let jus = makeIngredient("Jus")
        let sirop = makeIngredient("Sirop")
        let mocktail = makeCocktail(name: "Mocktail", links: [
            link(jus, role: .modifier), link(sirop, role: .modifier)
        ])

        let resultsFull = engine.computeAdvancedMatches(
            inventory: [jus.id: .available, sirop.id: .available],
            cocktails: [mocktail],
            substitutions: []
        )
        XCTAssertEqual(resultsFull[0].compatibilityScore, 1.0)

        let resultsPartial = engine.computeAdvancedMatches(
            inventory: [jus.id: .available],
            cocktails: [mocktail],
            substitutions: []
        )
        XCTAssertEqual(resultsPartial[0].compatibilityScore, 0.5, accuracy: 0.0001)
    }

    // MARK: - Cocktail multi-spiritueux

    func testMultiSpiritCocktailWeighsEachSpiritIndependently() {
        let rhumAmbre = makeIngredient("Rhum ambré")
        let rhumAgricole = makeIngredient("Rhum agricole")
        let cocktail = makeCocktail(name: "MaiTai", links: [
            link(rhumAmbre, role: .primarySpirit),
            link(rhumAgricole, role: .secondarySpirit)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [rhumAmbre.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        // 1.0 / (1.0 + 0.8) ≈ 0.5556
        XCTAssertEqual(results[0].compatibilityScore, 1.0 / 1.8, accuracy: 0.0001)
        XCTAssertEqual(results[0].missingIngredients.map(\.name), ["Rhum agricole"])
    }

    // MARK: - Seuil d'exclusion (cohérent avec la règle V1)

    func testCocktailExcludedWhenMoreThanTwoIngredientsFullyMissing() {
        let a = makeIngredient("A"), b = makeIngredient("B")
        let c = makeIngredient("C"), d = makeIngredient("D")
        let cocktail = makeCocktail(name: "Test10", links: [
            link(a, role: .modifier), link(b, role: .modifier),
            link(c, role: .modifier), link(d, role: .modifier)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [a.id: .available],
            cocktails: [cocktail],
            substitutions: []
        )

        XCTAssertTrue(results.isEmpty, "3 ingrédients totalement manquants > seuil de 2")
    }

    // MARK: - Tri des résultats

    func testResultsSortedByCompatibilityScoreDescending() {
        let rhum = makeIngredient("Rhum")
        let citron = makeIngredient("Citron")
        let highScore = makeCocktail(name: "Haut", links: [link(rhum, role: .primarySpirit)])
        let lowScore = makeCocktail(name: "Bas", links: [
            link(rhum, role: .primarySpirit), link(citron, role: .modifier)
        ])

        let results = engine.computeAdvancedMatches(
            inventory: [rhum.id: .available],
            cocktails: [lowScore, highScore],
            substitutions: []
        )

        XCTAssertEqual(results.first?.cocktail.name, "Haut")
    }

    // MARK: - Déterminisme

    func testComputeAdvancedMatchesIsDeterministic() {
        let rhum = makeIngredient("Rhum")
        let cocktail = makeCocktail(name: "Determ", links: [link(rhum, role: .primarySpirit)])
        let inventory: [UUID: StockStatus] = [rhum.id: .low]

        let first = engine.computeAdvancedMatches(inventory: inventory, cocktails: [cocktail], substitutions: [])
        let second = engine.computeAdvancedMatches(inventory: inventory, cocktails: [cocktail], substitutions: [])

        XCTAssertEqual(first[0].compatibilityScore, second[0].compatibilityScore)
    }

    // MARK: - Compatibilité V1 : le rôle ne doit jamais influencer computeMatches (V1)

    func testV1MethodIgnoresIngredientRoleEntirely() {
        let rhum = makeIngredient("Rhum")
        let menthe = makeIngredient("Menthe")
        // Rôles très différents (poids 1.0 vs 0.15) — si V1 les respectait
        // par erreur, le score ne serait pas celui, uniforme, attendu par
        // le protocole V1 d'origine.
        let cocktail = makeCocktail(name: "V1Check", links: [
            link(rhum, role: .primarySpirit), link(menthe, role: .garnish)
        ])

        let results = engine.computeMatches(
            availableIngredientIDs: [rhum.id],
            cocktails: [cocktail]
        )

        // V1 : score uniforme = ingrédients possédés / ingrédients requis = 1/2 = 0.5,
        // PAS le score pondéré V2 (qui donnerait ≈0.87 pour ce même cas).
        XCTAssertEqual(results[0].compatibilityScore, 0.5, accuracy: 0.0001)
    }
}
