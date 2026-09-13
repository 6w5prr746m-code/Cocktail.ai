import SwiftUI
import SwiftData
import Observation

/// Point central d'injection de dépendances de l'application.
/// Toutes les Views et ViewModels reçoivent leurs services via ce conteneur
/// plutôt que via des singletons globaux — ce qui garde le code testable
/// (on peut créer un AppContainer avec des services mockés pour les tests).
@MainActor
@Observable
final class AppContainer {

    let modelContainer: ModelContainer
    let navigation: AppNavigation
    let seedImporter: SeedImporter
    let matchingEngine: MatchingEngineProtocol

    // Les autres services métier (RecommendationEngine, ShareCardGenerator,
    // etc.) seront ajoutés ici au fur et à mesure des sprints suivants.

    init() {
        do {
            // Groupe "référence" : la bibliothèque de cocktails, 100% locale,
            // jamais synchronisée (voir Architecture Technique §6). Stockée
            // dans le conteneur App Group plutôt que le conteneur par défaut
            // de l'app, pour que le Widget iOS (Sprint 9, cible séparée)
            // puisse lire la même base sans dupliquer les données.
            //
            // ⚠️ Remplacer l'identifiant ci-dessous par le véritable
            // identifiant d'App Group du projet (Signing & Capabilities →
            // App Groups, à activer sur la cible app ET la cible widget).
            let referenceSchema = Schema([
                CocktailEntity.self,
                IngredientEntity.self,
                CocktailIngredientEntity.self,
                RecipeStepEntity.self,
                CollectionEntity.self,
                IngredientSubstitutionEntity.self
            ])
            let referenceConfiguration = ModelConfiguration(
                "Reference",
                schema: referenceSchema,
                isStoredInMemoryOnly: false,
                groupContainer: .identifier("group.com.peoplespheres.cocktailapp"),
                cloudKitDatabase: .none
            )

            // Groupe "utilisateur" : mon bar, favoris, historique — données
            // personnelles synchronisées via CloudKit privé. Ces entités ne
            // référencent la bibliothèque de référence que par UUID simple
            // (jamais par `@Relationship`), justement parce qu'elle vit dans
            // une configuration séparée non synchronisée — voir les
            // commentaires dans FavoriteEntity.swift et HistoryEntryEntity.swift.
            //
            // ⚠️ Remplacer l'identifiant iCloud ci-dessous par le véritable
            // identifiant de conteneur CloudKit du projet Xcode (onglet
            // Signing & Capabilities → iCloud → CloudKit → Containers).
            let userSchema = Schema([
                UserIngredientEntity.self,
                FavoriteEntity.self,
                HistoryEntryEntity.self
            ])
            let userConfiguration = ModelConfiguration(
                "User",
                schema: userSchema,
                isStoredInMemoryOnly: false,
                cloudKitDatabase: .private("iCloud.com.peoplespheres.cocktailapp")
            )

            let combinedSchema = Schema(
                referenceSchema.entities + userSchema.entities
            )

            self.modelContainer = try ModelContainer(
                for: combinedSchema,
                configurations: [referenceConfiguration, userConfiguration]
            )
        } catch {
            fatalError("Impossible d'initialiser le ModelContainer SwiftData : \(error)")
        }

        self.navigation = AppNavigation()
        self.seedImporter = SeedImporter()
        self.matchingEngine = MatchingEngine()
    }

    /// À appeler au lancement de l'app : importe le seed de cocktails
    /// si la base est vide (premier lancement).
    func bootstrap() async {
        let context = modelContainer.mainContext
        await seedImporter.importIfNeeded(into: context)
    }
}
