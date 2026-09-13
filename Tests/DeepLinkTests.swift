import XCTest
@testable import CocktailApp

final class DeepLinkTests: XCTestCase {

    func testValidCocktailURLResolvesToDestination() {
        let id = UUID()
        let url = URL(string: "cocktailapp://cocktail/\(id.uuidString)")!

        let destination = DeepLink.destination(for: url)

        guard case .cocktailDetail(let resolvedID) = destination else {
            XCTFail("La destination devrait être .cocktailDetail")
            return
        }
        XCTAssertEqual(resolvedID, id)
    }

    func testWrongSchemeIsRejected() {
        let id = UUID()
        let url = URL(string: "https://cocktail/\(id.uuidString)")!

        XCTAssertNil(DeepLink.destination(for: url))
    }

    func testMalformedUUIDIsRejected() {
        let url = URL(string: "cocktailapp://cocktail/not-a-uuid")!

        XCTAssertNil(DeepLink.destination(for: url))
    }

    func testUnknownPathIsRejected() {
        let id = UUID()
        let url = URL(string: "cocktailapp://collection/\(id.uuidString)")!

        XCTAssertNil(DeepLink.destination(for: url))
    }

    func testMatchesRealURLProducedByQRCodeGenerator() {
        let id = UUID()
        let generatedURL = QRCodeGenerator.deepLinkURL(forCocktailID: id)

        let destination = DeepLink.destination(for: generatedURL)

        guard case .cocktailDetail(let resolvedID) = destination else {
            XCTFail("La destination devrait être .cocktailDetail")
            return
        }
        XCTAssertEqual(resolvedID, id)
    }
}
