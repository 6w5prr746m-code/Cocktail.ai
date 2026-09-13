import Foundation

/// État qualitatif de "Mon Bar", dérivé du nombre d'ingrédients possédés
/// et surtout du nombre de cocktails réellement débloqués — c'est ce
/// second critère qui fait de cet état une vraie démonstration que Mon
/// Bar alimente le Matching Engine, pas juste un compteur d'ingrédients.
///
/// Value object pur, fonction déterministe des deux entrées — testable
/// sans SwiftData ni SwiftUI, cohérent avec le reste du Domain.
enum BarReadiness {
    case empty
    case almostReady
    case excellent

    /// Seuil à partir duquel le bar est considéré "excellent" — nombre de
    /// cocktails entièrement réalisables. Constante nommée plutôt que
    /// magique, ajustable sans changer la logique elle-même.
    static let excellentThreshold = 5

    static func evaluate(ingredientCount: Int, unlockedCocktailCount: Int) -> BarReadiness {
        guard ingredientCount > 0 else { return .empty }
        guard unlockedCocktailCount > 0 else { return .almostReady }
        return unlockedCocktailCount >= excellentThreshold ? .excellent : .almostReady
    }

    var title: String {
        switch self {
        case .empty: return "Ton bar est vide"
        case .almostReady: return "Ton bar prend forme"
        case .excellent: return "Excellent bar !"
        }
    }

    var subtitle: String {
        switch self {
        case .empty:
            return "Ajoute quelques ingrédients pour découvrir ce que tu peux préparer."
        case .almostReady:
            return "Encore quelques ingrédients et de nouveaux cocktails s'ouvriront à toi."
        case .excellent:
            return "Tu as de quoi préparer un large choix de cocktails dès maintenant."
        }
    }
}
