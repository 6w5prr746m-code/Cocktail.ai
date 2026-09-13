import Foundation

/// Le cœur "magique" de l'application. Implémente à la fois le contrat V1
/// (`MatchingEngineProtocol`, inchangé depuis le Sprint 1) et le contrat
/// V2 (`MatchingEngineV2Protocol`, Sprint Matching Engine V2).
///
/// ## Stratégie de migration V1 → V2 (décision de conception à lire avant
/// de modifier ce fichier)
///
/// La fonction privée `match(cocktail:availableIngredientIDs:)` ci-dessous
/// est la fonction V1 **strictement inchangée** — même signature, même
/// code, même comportement. Elle n'est appelée que par
/// `computeMatches(availableIngredientIDs:cocktails:)`, la méthode du
/// protocole V1.
///
/// Le nouvel algorithme pondéré vit entièrement dans une fonction séparée,
/// `matchAdvanced(...)`, appelée uniquement par
/// `computeAdvancedMatches(...)`, la méthode du protocole V2.
///
/// **Ce choix duplique une partie de la logique** (récupération des
/// ingrédients requis, garde sur cocktail invalide) plutôt que de
/// factoriser les deux algorithmes en un seul générique. C'est délibéré :
/// la consigne du sprint impose que le comportement V1 ne soit *jamais*
/// modifié, et les 7 tests de `MatchingEngineTests.swift` (non modifiés
/// par ce sprint) en sont la preuve vérifiable. Unifier les deux chemins
/// dans une seule fonction paramétrée aurait été plus élégant sur le
/// papier, mais aurait introduit un risque réel de dérive subtile du
/// comportement V1 à travers des cas limites partagés — un risque jugé
/// plus coûteux que la duplication elle-même.
struct MatchingEngine: MatchingEngineProtocol, MatchingEngineV2Protocol {

    /// Nombre maximum d'ingrédients *totalement* manquants (satisfaction
    /// nulle, aucune substitution utilisable) tolérés pour qu'un cocktail
    /// soit encore proposé. Partagé entre V1 et V2 : en V2, ce seuil
    /// s'applique au nombre d'ingrédients à satisfaction strictement
    /// nulle, pas aux ingrédients partiellement satisfaits (stock faible,
    /// substitution) — un ingrédient dégradé mais non nul ne doit jamais
    /// faire exclure un cocktail qui serait autrement pertinent.
    private let maxMissingIngredients = 2

    // MARK: - V1 (inchangé — voir note de stratégie ci-dessus)

    func computeMatches(
        availableIngredientIDs: Set<UUID>,
        cocktails: [CocktailEntity]
    ) -> [MatchResult] {
        cocktails.compactMap { cocktail in
            match(cocktail: cocktail, availableIngredientIDs: availableIngredientIDs)
        }
        .sorted { lhs, rhs in
            if lhs.compatibilityScore != rhs.compatibilityScore {
                return lhs.compatibilityScore > rhs.compatibilityScore
            }
            return lhs.missingIngredients.count < rhs.missingIngredients.count
        }
    }

    private func match(
        cocktail: CocktailEntity,
        availableIngredientIDs: Set<UUID>
    ) -> MatchResult? {
        let requiredLinks = cocktail.ingredients.filter { !$0.isOptional }

        guard !requiredLinks.isEmpty else { return nil }

        let requiredIDs = Set(requiredLinks.map { $0.ingredient.id })
        let missingIDs = requiredIDs.subtracting(availableIngredientIDs)

        guard missingIDs.count <= maxMissingIngredients else { return nil }

        let possessedCount = requiredIDs.count - missingIDs.count
        let score = Double(possessedCount) / Double(requiredIDs.count)

        let missingIngredients = requiredLinks
            .filter { missingIDs.contains($0.ingredient.id) }
            .map { $0.ingredient }

        return MatchResult(
            id: cocktail.id,
            cocktail: cocktail,
            compatibilityScore: score,
            missingIngredients: missingIngredients,
            isFullyAvailable: missingIDs.isEmpty
        )
    }

    // MARK: - V2

    func computeAdvancedMatches(
        inventory: [UUID: StockStatus],
        cocktails: [CocktailEntity],
        substitutions: [SubstitutionOption]
    ) -> [AdvancedMatchResult] {
        let substitutionsBySource = Dictionary(grouping: substitutions, by: \.sourceIngredientID)

        return cocktails
            .compactMap { cocktail in
                matchAdvanced(
                    cocktail: cocktail,
                    inventory: inventory,
                    substitutionsBySource: substitutionsBySource
                )
            }
            .sorted { lhs, rhs in
                if lhs.compatibilityScore != rhs.compatibilityScore {
                    return lhs.compatibilityScore > rhs.compatibilityScore
                }
                return lhs.proximityScore > rhs.proximityScore
            }
    }

    /// Satisfaction d'un lien ingrédient→cocktail, de 0.0 à 1.0. C'est le
    /// seul endroit où les cas "alcool manquant", "garniture manquante",
    /// "substitution", "quantité insuffisante" sont réellement tranchés —
    /// tout le reste de l'algorithme ne fait que pondérer et sommer cette
    /// valeur.
    ///
    /// Règles, dans l'ordre d'évaluation :
    /// 1. Ingrédient directement possédé, stock `.available` → 1.0
    /// 2. Ingrédient directement possédé, stock `.low` → 0.75 (quantité
    ///    probablement suffisante mais à surveiller — heuristique, pas un
    ///    calcul de volume exact contre la quantité de la recette, voir
    ///    limites en fin de sprint)
    /// 3. Ingrédient directement possédé, stock `.almostEmpty` → 0.4
    ///    (quantité probablement insuffisante pour une recette complète,
    ///    mais pas nulle : l'utilisateur a peut-être *juste* assez)
    /// 4. Ingrédient non possédé, mais une substitution utilisable existe
    ///    dans l'inventaire → le facteur de dégradation de la meilleure
    ///    substitution disponible (la plus proche de 1.0 si plusieurs)
    /// 5. Ingrédient non possédé, aucune substitution utilisable → 0.0
    ///
    /// Ces règles s'appliquent identiquement quel que soit le rôle de
    /// l'ingrédient (alcool principal, garniture, mixer...) — le rôle
    /// n'intervient que dans la *pondération* du score final, jamais dans
    /// le calcul de la satisfaction elle-même. C'est ce qui permet au
    /// moteur de traiter "cocktail sans alcool" et "cocktail
    /// multi-spiritueux" sans aucun cas particulier : un mocktail est
    /// simplement un cocktail dont aucun lien n'a le rôle `.primarySpirit`
    /// ; un cocktail multi-spiritueux a simplement plusieurs liens
    /// `.primarySpirit`/`.secondarySpirit`, chacun évalué indépendamment.
    private func satisfaction(
        for link: CocktailIngredientEntity,
        inventory: [UUID: StockStatus],
        substitutionsBySource: [UUID: [SubstitutionOption]]
    ) -> (fraction: Double, reason: DegradationReason?) {
        let ingredientID = link.ingredient.id

        if let status = inventory[ingredientID] {
            switch status {
            case .available:
                return (1.0, nil)
            case .low:
                return (0.75, .lowStock)
            case .almostEmpty:
                return (0.4, .almostEmptyStock)
            }
        }

        if let candidates = substitutionsBySource[ingredientID] {
            let usable = candidates.filter { inventory[$0.substituteIngredientID] != nil }
            if let best = usable.max(by: { $0.degradationFactor < $1.degradationFactor }) {
                return (best.degradationFactor, .substitution(best))
            }
        }

        return (0.0, nil)
    }

    private func matchAdvanced(
        cocktail: CocktailEntity,
        inventory: [UUID: StockStatus],
        substitutionsBySource: [UUID: [SubstitutionOption]]
    ) -> AdvancedMatchResult? {
        let requiredLinks = cocktail.ingredients.filter { !$0.isOptional }
        guard !requiredLinks.isEmpty else { return nil }

        let evaluations = requiredLinks.map { link in
            (link: link, result: satisfaction(for: link, inventory: inventory, substitutionsBySource: substitutionsBySource))
        }

        let zeroSatisfactionCount = evaluations.filter { $0.result.fraction == 0 }.count
        guard zeroSatisfactionCount <= maxMissingIngredients else { return nil }

        let totalWeight = requiredLinks.reduce(0.0) { $0 + $1.role.defaultWeight }
        let satisfiedWeight = evaluations.reduce(0.0) { $0 + $1.result.fraction * $1.link.role.defaultWeight }
        let compatibilityScore = totalWeight > 0 ? satisfiedWeight / totalWeight : 0

        let satisfiedCount = requiredLinks.count - zeroSatisfactionCount
        let proximityScore = Double(satisfiedCount) / Double(requiredLinks.count)

        let isFullyAvailable = evaluations.allSatisfy { $0.result.fraction == 1.0 }

        let missingIngredients = evaluations
            .filter { $0.result.fraction == 0 }
            .map(\.link.ingredient)

        let explanation = buildExplanation(
            cocktail: cocktail,
            evaluations: evaluations,
            totalWeight: totalWeight,
            satisfiedWeight: satisfiedWeight,
            inventory: inventory
        )

        let realizableVariants = cocktail.variants.map { variant in
            evaluateVariant(variant, inventory: inventory, substitutionsBySource: substitutionsBySource)
        }

        return AdvancedMatchResult(
            id: cocktail.id,
            cocktail: cocktail,
            availability: isFullyAvailable ? .ready : .missingFew,
            compatibilityScore: compatibilityScore,
            proximityScore: proximityScore,
            missingIngredients: missingIngredients,
            explanation: explanation,
            realizableVariants: realizableVariants
        )
    }

    private func buildExplanation(
        cocktail: CocktailEntity,
        evaluations: [(link: CocktailIngredientEntity, result: (fraction: Double, reason: DegradationReason?))],
        totalWeight: Double,
        satisfiedWeight: Double,
        inventory: [UUID: StockStatus]
    ) -> MatchExplanation {
        let missing = evaluations
            .filter { $0.result.fraction == 0 }
            .map { MissingIngredientDetail(ingredient: $0.link.ingredient, role: $0.link.role) }

        let degraded = evaluations
            .filter { $0.result.fraction > 0 && $0.result.fraction < 1.0 }
            .compactMap { evaluation -> DegradedIngredientDetail? in
                guard let reason = evaluation.result.reason else { return nil }
                return DegradedIngredientDetail(
                    ingredient: evaluation.link.ingredient,
                    role: evaluation.link.role,
                    reason: reason,
                    satisfactionFraction: evaluation.result.fraction
                )
            }

        let optionalLinks = cocktail.ingredients.filter(\.isOptional)
        let bonusOptional = optionalLinks
            .filter { inventory[$0.ingredient.id] != nil }
            .map(\.ingredient)

        return MatchExplanation(
            satisfiedWeight: satisfiedWeight,
            totalWeight: totalWeight,
            missingIngredients: missing,
            degradedIngredients: degraded,
            bonusOptionalIngredientsPresent: bonusOptional
        )
    }

    /// Évalue une variante avec le même algorithme que le cocktail
    /// principal, sur sa propre liste d'ingrédients — un seul niveau de
    /// profondeur (pas de récursion sur `variant.variants`).
    private func evaluateVariant(
        _ variant: CocktailEntity,
        inventory: [UUID: StockStatus],
        substitutionsBySource: [UUID: [SubstitutionOption]]
    ) -> VariantAvailability {
        let requiredLinks = variant.ingredients.filter { !$0.isOptional }
        guard !requiredLinks.isEmpty else {
            return VariantAvailability(variant: variant, isFullyAvailable: false, compatibilityScore: 0)
        }

        let evaluations = requiredLinks.map {
            satisfaction(for: $0, inventory: inventory, substitutionsBySource: substitutionsBySource)
        }
        let totalWeight = requiredLinks.reduce(0.0) { $0 + $1.role.defaultWeight }
        let satisfiedWeight = zip(requiredLinks, evaluations).reduce(0.0) { $0 + $1.1.fraction * $1.0.role.defaultWeight }
        let score = totalWeight > 0 ? satisfiedWeight / totalWeight : 0
        let isFullyAvailable = evaluations.allSatisfy { $0.fraction == 1.0 }

        return VariantAvailability(variant: variant, isFullyAvailable: isFullyAvailable, compatibilityScore: score)
    }
}
