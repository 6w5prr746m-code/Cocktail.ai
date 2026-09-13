import Foundation

/// Statut qualitatif du stock d'un ingrédient dans "Mon Bar".
///
/// Value object pur — aucune dépendance à SwiftUI (pas de couleur, pas
/// d'icône ici, voir `DesignSystem` pour leur mapping visuel) ni à
/// SwiftData au-delà de `Codable` (nécessaire pour être stocké comme
/// propriété d'un `@Model`). Cohérent avec la règle du projet : le domaine
/// métier reste indépendant de la couche de présentation.
enum StockStatus: String, Codable, CaseIterable, Identifiable {
    case available
    case low
    case almostEmpty

    var id: String { rawValue }

    /// Libellé français affiché à l'utilisateur.
    var label: String {
        switch self {
        case .available: return "Disponible"
        case .low: return "Faible"
        case .almostEmpty: return "Presque terminé"
        }
    }

    /// Ordre d'affichage naturel (du plus au moins disponible) — utilisé
    /// pour trier "Mon Bar" sans dépendre de l'ordre de déclaration du enum.
    var sortOrder: Int {
        switch self {
        case .available: return 0
        case .low: return 1
        case .almostEmpty: return 2
        }
    }
}
