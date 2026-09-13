import WidgetKit
import SwiftData
import Foundation

/// Widget "Suggestion du jour" (US : "Widget iOS (cocktail du jour /
/// suggestion)"). Vit dans une cible d'extension séparée — voir README
/// pour la configuration Xcode complète (App Group requis).
///
/// Sélection du cocktail : en l'absence du `RecommendationEngine` (V2),
/// on choisit un cocktail de façon déterministe à partir du jour de
/// l'année (même cocktail affiché toute la journée, change le lendemain,
/// sans avoir besoin de stocker un historique de suggestions).
struct CocktailWidgetEntry: TimelineEntry {
    let date: Date
    let cocktailName: String
    let cocktailCategory: String
    let cocktailID: UUID?
}

struct CocktailWidgetProvider: TimelineProvider {

    func placeholder(in context: Context) -> CocktailWidgetEntry {
        CocktailWidgetEntry(date: .now, cocktailName: "Mojito", cocktailCategory: "Classique", cocktailID: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (CocktailWidgetEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CocktailWidgetEntry>) -> Void) {
        let entry = fetchTodaysSuggestion()

        // Rafraîchissement à minuit, pour changer de suggestion chaque jour.
        let midnight = Calendar.current.nextDate(
            after: .now,
            matching: DateComponents(hour: 0, minute: 0),
            matchingPolicy: .nextTime
        ) ?? .now.addingTimeInterval(86_400)

        completion(Timeline(entries: [entry], policy: .after(midnight)))
    }

    private func fetchTodaysSuggestion() -> CocktailWidgetEntry {
        do {
            let schema = Schema([
                CocktailEntity.self,
                IngredientEntity.self,
                CocktailIngredientEntity.self,
                RecipeStepEntity.self
            ])
            let configuration = ModelConfiguration(
                "Reference",
                schema: schema,
                groupContainer: .identifier("group.com.peoplespheres.cocktailapp")
            )
            let container = try ModelContainer(for: schema, configurations: [configuration])
            let context = container.mainContext

            let cocktails = try context.fetch(FetchDescriptor<CocktailEntity>(sortBy: [SortDescriptor(\.name)]))
            guard !cocktails.isEmpty else {
                return CocktailWidgetEntry(date: .now, cocktailName: "Ouvre l'app", cocktailCategory: "—", cocktailID: nil)
            }

            let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: .now) ?? 1
            let cocktail = cocktails[dayOfYear % cocktails.count]

            return CocktailWidgetEntry(
                date: .now,
                cocktailName: cocktail.name,
                cocktailCategory: cocktail.category,
                cocktailID: cocktail.id
            )
        } catch {
            return CocktailWidgetEntry(date: .now, cocktailName: "Cocktail App", cocktailCategory: "—", cocktailID: nil)
        }
    }
}
