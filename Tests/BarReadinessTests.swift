import XCTest
@testable import CocktailApp

final class BarReadinessTests: XCTestCase {

    func testEmptyBarWhenNoIngredients() {
        let result = BarReadiness.evaluate(ingredientCount: 0, unlockedCocktailCount: 0)
        XCTAssertEqual(result.title, BarReadiness.empty.title)
    }

    func testAlmostReadyWhenIngredientsButNothingUnlocked() {
        let result = BarReadiness.evaluate(ingredientCount: 2, unlockedCocktailCount: 0)
        XCTAssertEqual(result.title, BarReadiness.almostReady.title)
    }

    func testAlmostReadyBelowExcellentThreshold() {
        let result = BarReadiness.evaluate(
            ingredientCount: 5,
            unlockedCocktailCount: BarReadiness.excellentThreshold - 1
        )
        XCTAssertEqual(result.title, BarReadiness.almostReady.title)
    }

    func testExcellentAtThreshold() {
        let result = BarReadiness.evaluate(
            ingredientCount: 10,
            unlockedCocktailCount: BarReadiness.excellentThreshold
        )
        XCTAssertEqual(result.title, BarReadiness.excellent.title)
    }

    func testExcellentAboveThreshold() {
        let result = BarReadiness.evaluate(
            ingredientCount: 20,
            unlockedCocktailCount: BarReadiness.excellentThreshold + 10
        )
        XCTAssertEqual(result.title, BarReadiness.excellent.title)
    }

    func testStockStatusSortOrderIsAvailableFirstThenLowThenAlmostEmpty() {
        let sorted = StockStatus.allCases.sorted { $0.sortOrder < $1.sortOrder }
        XCTAssertEqual(sorted, [.available, .low, .almostEmpty])
    }
}
