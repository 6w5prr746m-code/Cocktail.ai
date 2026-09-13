import Foundation

/// Contrat du Matching Engine V2 — voir `MatchingEngineProtocol` pour le
/// contrat V1, volontairement inchangé et toujours en usage par
/// `IngredientPickerViewModel`/`MyBarViewModel`. Ce second protocole
/// coexiste plutôt que de remplacer le premier : aucun appelant existant
/// n'a besoin de connaître ce protocole pour continuer à fonctionner.
protocol MatchingEngineV2Protocol {
    /// Calcule un résultat enrichi (score pondéré, substitutions,
    /// dégradation de stock, variantes réalisables, explication
    /// structurée) pour chaque cocktail, à partir d'un inventaire qui
    /// associe un ingrédient à son statut de stock plutôt qu'à une simple
    /// présence binaire.
    func computeAdvancedMatches(
        inventory: [UUID: StockStatus],
        cocktails: [CocktailEntity],
        substitutions: [SubstitutionOption]
    ) -> [AdvancedMatchResult]
}
