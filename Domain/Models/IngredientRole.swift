import Foundation

/// Rôle d'un ingrédient *dans une recette donnée* — pas une propriété
/// globale de l'ingrédient lui-même. Le même ingrédient (ex: "Citron
/// vert") peut être l'ingrédient structurant d'un Daiquiri et une simple
/// garniture dans un Mojito — c'est pourquoi ce champ vit sur
/// `CocktailIngredientEntity` (la table de jointure) et non sur
/// `IngredientEntity`.
///
/// Value object pur, indépendant de SwiftUI/SwiftData au-delà de
/// `Codable` (nécessaire pour être stocké comme propriété d'un `@Model`).
enum IngredientRole: String, Codable, CaseIterable, Identifiable {
    case primarySpirit
    case secondarySpirit
    case modifier
    case mixer
    case garnish

    var id: String { rawValue }

    /// Poids relatif par défaut de ce rôle dans le score pondéré du
    /// Matching Engine V2 — voir `MatchingEngine.matchAdvanced` pour
    /// l'algorithme complet. Valeurs choisies pour que l'alcool principal
    /// pèse largement plus qu'une garniture, sans jamais réduire son poids
    /// à zéro (une garniture manquante doit rester visible dans
    /// l'explication, jamais totalement invisible).
    var defaultWeight: Double {
        switch self {
        case .primarySpirit: return 1.0
        case .secondarySpirit: return 0.8
        case .modifier: return 0.6
        case .mixer: return 0.35
        case .garnish: return 0.15
        }
    }

    var label: String {
        switch self {
        case .primarySpirit: return "Alcool principal"
        case .secondarySpirit: return "Alcool secondaire"
        case .modifier: return "Ingrédient structurant"
        case .mixer: return "Mixer"
        case .garnish: return "Garniture"
        }
    }
}
