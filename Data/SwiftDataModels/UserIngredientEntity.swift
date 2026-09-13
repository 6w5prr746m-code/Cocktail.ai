import SwiftData
import Foundation

/// Représente un ingrédient que l'utilisateur possède réellement — la
/// source de vérité de "Mon Bar" (Sprint My Bar 2.0).
///
/// Comme pour `FavoriteEntity`, cette entité est synchronisée CloudKit :
/// `ingredientID` reste un simple UUID plutôt qu'une relation vers
/// `IngredientEntity` (référentiel local non synchronisé), et `id` n'est
/// pas marqué `.unique` (contrainte interdite par CloudKit).
///
/// ⚠️ Changement de schéma (Sprint My Bar 2.0) : l'ancien champ
/// `stockLevel: Int?` (0-100, jamais exploité — voir audit) est remplacé
/// par deux champs distincts et sans ambiguïté :
/// - `stockStatus` : le statut qualitatif à 3 états demandé par le produit
///   (disponible / faible / presque terminé), piloté par une vraie UI à
///   sélection rapide plutôt qu'un curseur 0-100 peu adapté au mobile.
/// - `approximateQuantity` : un texte libre optionnel et distinct
///   ("environ 1 bouteille", "3/4 restant"...), qui répond à un besoin
///   différent du statut qualitatif.
/// Ce changement est fait sans stratégie de migration explicite car
/// l'audit précédent a confirmé qu'aucun build réel de l'app n'a jamais
/// eu lieu — aucune donnée CloudKit n'a donc jamais été synchronisée avec
/// l'ancien schéma. Recommandation pour la suite : dès le premier vrai
/// lancement en production, introduire un `VersionedSchema` avant tout
/// nouveau changement de ce type (déjà noté dans le plan de chantiers).
@Model
final class UserIngredientEntity {
    var id: UUID
    var ingredientID: UUID
    var addedAt: Date
    var stockStatus: StockStatus = StockStatus.available
    var approximateQuantity: String?

    init(
        id: UUID = UUID(),
        ingredientID: UUID,
        stockStatus: StockStatus = .available,
        approximateQuantity: String? = nil
    ) {
        self.id = id
        self.ingredientID = ingredientID
        self.addedAt = .now
        self.stockStatus = stockStatus
        self.approximateQuantity = approximateQuantity
    }
}
