import Foundation

/// Pourquoi un ingrédient manquant a un score réduit plutôt que nul —
/// donnée structurée, jamais une phrase. C'est à la couche de
/// présentation (Views/ViewModels) de transformer ça en texte si besoin,
/// jamais au moteur.
enum DegradationReason: Equatable {
    case lowStock
    case almostEmptyStock
    case substitution(SubstitutionOption)
}

/// Un ingrédient requis totalement manquant (satisfaction = 0), sans
/// substitution utilisable dans l'inventaire fourni.
struct MissingIngredientDetail: Identifiable, Equatable {
    var id: UUID { ingredient.id }
    let ingredient: IngredientEntity
    let role: IngredientRole
}

/// Un ingrédient requis partiellement satisfait (stock faible/presque
/// terminé, ou couvert par une substitution) — le score n'est pas nul
/// mais n'est pas non plus celui d'une possession pleine.
struct DegradedIngredientDetail: Identifiable, Equatable {
    var id: UUID { ingredient.id }
    let ingredient: IngredientEntity
    let role: IngredientRole
    let reason: DegradationReason
    let satisfactionFraction: Double
}

/// Explication structurée d'un résultat de matching — répond à "pourquoi
/// ce score", jamais sous forme de phrase. Le moteur ne génère aucun
/// texte, seulement des données.
struct MatchExplanation: Equatable {
    let satisfiedWeight: Double
    let totalWeight: Double
    let missingIngredients: [MissingIngredientDetail]
    let degradedIngredients: [DegradedIngredientDetail]
    /// Ingrédients optionnels que l'utilisateur possède en plus — n'a
    /// aucun impact sur le score (règle V1 conservée), purement informatif.
    let bonusOptionalIngredientsPresent: [IngredientEntity]
}

/// Disponibilité d'une variante de cocktail (voir `CocktailEntity.variants`)
/// calculée avec le même algorithme, sur la propre liste d'ingrédients de
/// la variante — un seul niveau de profondeur, pas de récursion sur les
/// variantes d'une variante.
struct VariantAvailability: Identifiable, Equatable {
    var id: UUID { variant.id }
    let variant: CocktailEntity
    let isFullyAvailable: Bool
    let compatibilityScore: Double

    static func == (lhs: VariantAvailability, rhs: VariantAvailability) -> Bool {
        lhs.id == rhs.id && lhs.compatibilityScore == rhs.compatibilityScore
    }
}

/// Disponibilité globale d'un résultat V2 — catégorie discrète dérivée du
/// score, utile pour un affichage groupé sans recalculer de seuils côté UI.
enum Availability {
    case ready         // tous les ingrédients requis à satisfaction pleine (1.0)
    case missingFew     // partiellement satisfait, retenu car sous le seuil d'exclusion
}

/// Résultat enrichi du Matching Engine V2. Coexiste avec `MatchResult`
/// (V1, inchangé) plutôt que de le remplacer — voir `MatchingEngine` pour
/// la stratégie de migration complète.
struct AdvancedMatchResult: Identifiable {
    let id: UUID
    let cocktail: CocktailEntity
    let availability: Availability
    /// Score pondéré par l'importance des ingrédients (0.0 à 1.0) — voir
    /// l'algorithme documenté dans `MatchingEngine`.
    let compatibilityScore: Double
    /// Score de proximité, ignorant les poids — proportion d'ingrédients
    /// requis satisfaits (au moins partiellement), utile pour trier "à
    /// combien d'ingrédients suis-je" indépendamment de leur importance.
    let proximityScore: Double
    /// Liste plate des ingrédients totalement manquants (satisfaction 0),
    /// même forme que `MatchResult.missingIngredients` (V1) pour faciliter
    /// une migration progressive côté UI si besoin.
    let missingIngredients: [IngredientEntity]
    let explanation: MatchExplanation
    let realizableVariants: [VariantAvailability]
}
