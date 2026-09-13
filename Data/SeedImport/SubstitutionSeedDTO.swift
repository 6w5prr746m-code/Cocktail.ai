import Foundation

/// Représentation brute d'une substitution dans le fichier JSON de seed.
/// Les ingrédients sont référencés par `slug` (comme dans
/// `IngredientSeedDTO`), résolus après coup par `SeedImporter` une fois
/// tous les ingrédients du seed de cocktails importés.
struct SubstitutionSeedDTO: Codable {
    let sourceSlug: String
    let substituteSlug: String
    let degradationFactor: Double
}
