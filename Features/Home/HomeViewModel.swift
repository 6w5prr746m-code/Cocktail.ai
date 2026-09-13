import SwiftUI
import SwiftData
import Observation

/// ViewModel de l'accueil — alimente les 4 sections (US-F2).
///
/// Note V1 : en l'absence du RecommendationEngine (prévu V2) et d'un
/// compteur de popularité réel (prévu avec la fonction communautaire),
/// "Populaires" et "Recommandés" s'appuient sur des heuristiques simples
/// pour l'instant plutôt que de laisser les sections vides. Ces
/// heuristiques sont clairement isolées ici pour être remplacées sans
/// toucher à la Vue.
@MainActor
@Observable
final class HomeViewModel {

    private let modelContext: ModelContext

    var popularCocktails: [CocktailEntity] = []
    var newCocktails: [CocktailEntity] = []
    var recommendedCocktails: [CocktailEntity] = []
    var favoriteCocktails: [CocktailEntity] = []

    var isShowingIngredientPicker = false

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func loadSections() {
        let allCocktails = (try? modelContext.fetch(FetchDescriptor<CocktailEntity>())) ?? []

        // Correctif Sprint 10 (performance, voir README) : ces sections
        // sont bornées à 20 cartes. Sans cette limite, une fois la base
        // enrichie vers les 500-1000 cocktails visés par le PRD, l'accueil
        // tenterait de préparer des centaines de vues d'un coup — un vrai
        // risque pour l'objectif 60 FPS sur iPhone SE.
        let sectionLimit = 20

        // "Populaires" : à défaut de données de popularité réelle (V2), on
        // met en avant les classiques en premier, puis on trie par nom.
        //
        // Correctif Sprint 10 : la version précédente ne triait par nom
        // qu'entre deux cocktails de la même catégorie exacte ; entre deux
        // catégories différentes non-"Classique" (ex: "Tiki" vs "Moderne"),
        // le résultat dépendait de l'ordre arbitraire renvoyé par SwiftData
        // — pas un crash, mais un tri peu prévisible, repéré en revue de code.
        popularCocktails = Array(
            allCocktails.sorted { lhs, rhs in
                let lhsIsClassic = lhs.category == "Classique"
                let rhsIsClassic = rhs.category == "Classique"
                if lhsIsClassic != rhsIsClassic { return lhsIsClassic }
                return lhs.name < rhs.name
            }
            .prefix(sectionLimit)
        )

        // "Nouveautés" : les cocktails les plus récemment ajoutés à la base.
        newCocktails = Array(allCocktails.sorted { $0.createdAt > $1.createdAt }.prefix(sectionLimit))

        // "Recommandés" : stub en attendant le RecommendationEngine (V2) —
        // on réutilise l'ordre des populaires pour ne pas laisser un écran
        // vide, conformément à la règle "aucune page vide" du brief.
        recommendedCocktails = popularCocktails

        let favoriteDescriptor = FetchDescriptor<FavoriteEntity>(
            sortBy: [SortDescriptor(\.addedAt, order: .reverse)]
        )
        let favorites = (try? modelContext.fetch(favoriteDescriptor)) ?? []
        let favoriteCocktailIDs = favorites.map(\.cocktailID)

        // Les favoris et la bibliothèque de référence vivent dans deux
        // configurations SwiftData distinctes (voir AppContainer) : on
        // résout donc les cocktails par id plutôt que par relation directe.
        favoriteCocktails = favoriteCocktailIDs.compactMap { id in
            allCocktails.first { $0.id == id }
        }
    }
}
