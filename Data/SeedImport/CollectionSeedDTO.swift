import Foundation

/// Représentation brute d'une collection dans le fichier JSON de seed.
/// Les cocktails sont référencés par nom (les 5 cocktails du seed n'ont
/// pas encore de slug stable) — voir note dans CollectionSeedImporter.
struct CollectionSeedDTO: Codable {
    let name: String
    let iconName: String
    let cocktailNames: [String]
}
