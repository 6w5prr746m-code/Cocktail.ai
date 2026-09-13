import SwiftUI
import SwiftData

/// Résout une `AppNavigation.Destination` en Vue concrète. Centralisé ici
/// pour être appliqué à la fois sur la NavigationStack de l'onglet Accueil
/// (RootView) et sur celle, indépendante, de la sheet IngredientPickerView
/// — sans dupliquer le switch dans les deux endroits.
@ViewBuilder
func destinationView(
    for destination: AppNavigation.Destination,
    modelContext: ModelContext
) -> some View {
    switch destination {
    case .cocktailDetail(let id):
        CocktailDetailView(cocktailID: id, modelContext: modelContext)

    case .preparationMode(let id):
        PreparationModeView(cocktailID: id, modelContext: modelContext)

    case .collection(let id):
        CollectionDetailView(collectionID: id, modelContext: modelContext)

    case .createRecipe:
        RecipeFormView(modelContext: modelContext)

    case .editRecipe(let id):
        RecipeFormView(modelContext: modelContext, existingCocktailID: id)
    }
}

/// Placeholder réutilisé pour toutes les destinations pas encore
/// développées — respecte la règle "aucune page vide" du brief tout en
/// étant honnête sur ce qui n'existe pas encore.
struct ComingSoonView: View {
    let title: String
    let sprint: String

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()
            ContentUnavailableView(
                title,
                systemImage: "hourglass",
                description: Text("Cet écran arrive au \(sprint).")
            )
            .foregroundStyle(AppColors.textSecondary)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
