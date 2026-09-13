import Foundation

/// Parse les URLs de deep link `cocktailapp://...` en destinations de
/// navigation. Séparé de `AppNavigation` et de la Vue pour rester
/// testable sans dépendance à SwiftUI ni à un ModelContext.
///
/// Format supporté : `cocktailapp://cocktail/<uuid>` — généré à la fois
/// par le QR code de partage (Sprint 8) et par le widget "Suggestion du
/// jour" (Sprint 9), qui restaient jusqu'ici non fonctionnels de bout en
/// bout faute de ce parseur et de son branchement dans `CocktailApp.swift`.
enum DeepLink {
    static func destination(for url: URL) -> AppNavigation.Destination? {
        guard url.scheme == "cocktailapp" else { return nil }

        // Deux formes possibles selon la façon dont l'URL a été construite :
        // `cocktailapp://cocktail/<uuid>` (host = "cocktail", 1 path component)
        // On normalise en combinant host + pathComponents pour être robuste
        // aux deux interprétations.
        var segments: [String] = []
        if let host = url.host, !host.isEmpty { segments.append(host) }
        segments.append(contentsOf: url.pathComponents.filter { $0 != "/" })

        guard segments.count >= 2, segments[0] == "cocktail" else { return nil }
        guard let id = UUID(uuidString: segments[1]) else { return nil }

        return .cocktailDetail(id: id)
    }
}
