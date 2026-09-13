import SwiftUI
import SwiftData

/// Écran Favoris — voir PRD US-D3.
struct FavoritesView: View {

    let modelContext: ModelContext
    @State private var viewModel: FavoritesViewModel

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        _viewModel = State(initialValue: FavoritesViewModel(modelContext: modelContext))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                if viewModel.favoriteCocktails.isEmpty {
                    ContentUnavailableView(
                        "Aucun favori pour l'instant",
                        systemImage: "heart",
                        description: Text("Ajoute un cocktail à tes favoris depuis sa fiche pour le retrouver ici.")
                    )
                    .foregroundStyle(AppColors.textSecondary)
                } else {
                    List {
                        ForEach(viewModel.favoriteCocktails) { cocktail in
                            NavigationLink(value: AppNavigation.Destination.cocktailDetail(id: cocktail.id)) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(cocktail.name)
                                            .font(AppTypography.cocktailName)
                                            .foregroundStyle(AppColors.textPrimary)
                                        Text(cocktail.category)
                                            .font(AppTypography.label)
                                            .foregroundStyle(AppColors.textSecondary)
                                    }
                                }
                            }
                            .listRowBackground(AppColors.surface)
                        }
                        .onDelete(perform: removeFavorites)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Favoris")
            .navigationDestination(for: AppNavigation.Destination.self) { destination in
                destinationView(for: destination, modelContext: modelContext)
            }
        }
        .onAppear { viewModel.load() }
    }

    private func removeFavorites(at offsets: IndexSet) {
        for index in offsets {
            viewModel.removeFavorite(viewModel.favoriteCocktails[index])
        }
    }
}
