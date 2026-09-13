import SwiftUI
import SwiftData

/// Écran plein écran de la recherche magique — voir Design System §5.2.
/// Présenté en sheet depuis l'accueil (transition glassmorphism native
/// de SwiftUI). Chaque tap sur un chip recalcule les résultats sans
/// bouton de validation (US-A1).
struct IngredientPickerView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: IngredientPickerViewModel
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        _viewModel = State(
            initialValue: IngredientPickerViewModel(
                matchingEngine: MatchingEngine(),
                modelContext: modelContext
            )
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    searchField
                    ingredientGrid
                    Divider().background(AppColors.textSecondary.opacity(0.15))
                    resultsSection
                }
            }
            .navigationDestination(for: AppNavigation.Destination.self) { destination in
                destinationView(for: destination, modelContext: modelContext)
            }
            .navigationTitle("Qu'as-tu dans ton bar ?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(AppColors.textPrimary)
                    }
                }
                if viewModel.myBarIngredientCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                viewModel.preselectFromMyBar()
                            }
                        } label: {
                            Label("Utiliser Mon Bar", systemImage: "wineglass.fill")
                                .font(AppTypography.label)
                        }
                        .accessibilityHint("Présélectionne les ingrédients déjà déclarés dans Mon Bar")
                    }
                }
            }
        }
        .onAppear { viewModel.loadIngredients() }
    }

    private var searchField: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(AppColors.textSecondary)
            TextField("Recherche libre…", text: $viewModel.searchText)
                .foregroundStyle(AppColors.textPrimary)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(AppColors.surface)
        )
        .padding()
    }

    private var ingredientGrid: some View {
        ScrollView {
            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 90), spacing: 8)],
                spacing: 8
            ) {
                ForEach(viewModel.filteredIngredients) { ingredient in
                    IngredientChip(
                        name: ingredient.name,
                        isSelected: viewModel.isSelected(ingredient)
                    ) {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            viewModel.toggle(ingredient)
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
        .frame(maxHeight: 220)
    }

    @ViewBuilder
    private var resultsSection: some View {
        if !viewModel.hasEnoughIngredients {
            ContentUnavailableView(
                "Encore \(viewModel.minimumIngredientsRequired - viewModel.selectedIngredientIDs.count) ingrédient(s)",
                systemImage: "sparkles",
                description: Text("Sélectionne au moins \(viewModel.minimumIngredientsRequired) ingrédients pour voir la magie opérer")
            )
            .foregroundStyle(AppColors.textSecondary)
        } else if viewModel.results.isEmpty {
            ContentUnavailableView(
                "Aucun cocktail possible",
                systemImage: "questionmark.circle",
                description: Text("Essaie d'ajouter d'autres ingrédients")
            )
            .foregroundStyle(AppColors.textSecondary)
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.results) { result in
                        NavigationLink(value: AppNavigation.Destination.cocktailDetail(id: result.cocktail.id)) {
                            ResultRow(result: result)
                        }
                        .buttonStyle(.plain)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                }
                .padding()
                .animation(.spring(response: 0.4, dampingFraction: 0.85), value: viewModel.results)
            }
        }
    }
}

/// Ligne de résultat : "Tu peux faire" ou "il te manque X pour Y" (US-A3).
private struct ResultRow: View {
    let result: MatchResult

    var body: some View {
        GlassCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(result.cocktail.name)
                        .font(AppTypography.cocktailName)
                        .foregroundStyle(AppColors.textPrimary)

                    if result.isFullyAvailable {
                        Label("Tu peux faire ce cocktail", systemImage: "checkmark.circle.fill")
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.accentGold)
                    } else {
                        Text("Il te manque : \(result.missingIngredients.map(\.name).joined(separator: ", "))")
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                }
                Spacer()
                CompatibilityRing(progress: result.compatibilityScore, size: 48)
            }
        }
    }
}
