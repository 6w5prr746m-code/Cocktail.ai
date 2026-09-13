import SwiftData
import Foundation

/// Une relation de substitution entre deux ingrédients du référentiel —
/// contenu curé par l'équipe produit, jamais inféré automatiquement, pour
/// que le Matching Engine reste déterministe. À sens unique par défaut
/// (une substitution n'est pas forcément symétrique en mixologie réelle :
/// "pas de Cointreau ? Triple sec" ne veut pas dire l'inverse fonctionne
/// aussi bien) — une substitution bidirectionnelle nécessite deux lignes.
///
/// Vit dans la configuration "Reference" (locale, non-CloudKit) — c'est
/// du contenu, au même titre que les collections, pas une donnée
/// personnelle. Alimentée par le même pipeline `SeedImporter` que les
/// cocktails et les collections.
@Model
final class IngredientSubstitutionEntity {
    var id: UUID
    /// L'ingrédient qu'on cherche à remplacer.
    var sourceIngredientID: UUID
    /// L'ingrédient de remplacement proposé.
    var substituteIngredientID: UUID
    /// Facteur de dégradation du score si cette substitution est utilisée,
    /// de 0.0 à 1.0 — voir `MatchingEngine.matchAdvanced`.
    var degradationFactor: Double

    init(
        id: UUID = UUID(),
        sourceIngredientID: UUID,
        substituteIngredientID: UUID,
        degradationFactor: Double
    ) {
        self.id = id
        self.sourceIngredientID = sourceIngredientID
        self.substituteIngredientID = substituteIngredientID
        self.degradationFactor = degradationFactor
    }
}
