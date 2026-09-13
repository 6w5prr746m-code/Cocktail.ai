import Foundation

/// Représentation brute d'un cocktail dans le fichier JSON de seed.
/// Volontairement découplée des @Model SwiftData : le format de contenu
/// (livré par l'équipe produit/contenu) ne doit pas dépendre des détails
/// de persistance, et inversement.
struct CocktailSeedDTO: Codable {
    let name: String
    let category: String
    let origin: String?
    let history: String?
    let difficulty: Int
    let mainSpirit: String
    let preparationTimeMinutes: Int
    let glassware: String
    let iceType: String
    let garnish: String
    let tips: String?
    let imageURL: String
    let ingredients: [IngredientSeedDTO]
    let steps: [StepSeedDTO]
}

struct IngredientSeedDTO: Codable {
    let slug: String
    let name: String
    let category: String
    let colorHex: String?
    let quantity: Double
    let unit: String
    let isOptional: Bool
    /// Rôle de l'ingrédient dans cette recette (Sprint Matching Engine V2).
    /// Optionnel — `SeedImporter` retombe sur `.modifier` si absent ou si
    /// la valeur ne correspond à aucun cas de `IngredientRole`, pour ne
    /// jamais faire échouer l'import sur une entrée JSON écrite avant ce
    /// sprint.
    let role: String?
}

struct StepSeedDTO: Codable {
    let order: Int
    let instruction: String
    let durationSeconds: Int?
}
