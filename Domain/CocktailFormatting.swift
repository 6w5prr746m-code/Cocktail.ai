import Foundation

/// Petit utilitaire de formatage partagé entre `CocktailDetailView` et
/// `RecipeFormViewModel` — les deux avaient fini par implémenter la même
/// logique de formatage de quantité indépendamment (0.5 → "0.5", 6.0 → "6").
/// Regroupé ici en revue de code (Sprint 10) plutôt que laissé dupliqué.
enum CocktailFormatting {
    static func quantityLabel(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(value))
            : String(format: "%.1f", value)
    }
}
