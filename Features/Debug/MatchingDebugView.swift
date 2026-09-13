import SwiftUI
import SwiftData

/// Écran de debug du Sprint 1. Objectif unique : valider que le score de
/// compatibilité "paraît intelligent" avant de construire le vrai picker
/// d'ingrédients animé (Sprint 2). Volontairement minimaliste (checkboxes),
/// pas de design final ici.
struct MatchingDebugView: View {

    @State private var viewModel: MatchingDebugViewModel

    init(modelContext: ModelContext) {
        _viewModel = State(
            initialValue: MatchingDebugViewModel(
                matchingEngine: MatchingEngine(),
                modelContext: modelContext
            )
        )
    }

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                ingredientSelector
                Divider().background(AppColors.textSecondary.opacity(0.2))
                resultsList
            }
        }
        .navigationTitle("Debug — Moteur de matching")
        .onAppear { viewModel.loadIngredients() }
    }

    private var ingredientSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: 8) {
                ForEach(viewModel.allIngredients) { ingredient in
                    IngredientChip(
                        name: ingredient.name,
                        isSelected: viewModel.selectedIngredientIDs.contains(ingredient.id)
                    ) {
                        viewModel.toggle(ingredient)
                    }
                }
            }
            .padding()
        }
        .frame(height: 60)
    }

    private var resultsList: some View {
        Group {
            if viewModel.selectedIngredientIDs.count < 3 {
                ContentUnavailableView(
                    "Sélectionne au moins 3 ingrédients",
                    systemImage: "checklist",
                    description: Text("\(viewModel.selectedIngredientIDs.count)/3 sélectionnés")
                )
                .foregroundStyle(AppColors.textSecondary)
            } else if viewModel.results.isEmpty {
                ContentUnavailableView(
                    "Aucun cocktail trouvé",
                    systemImage: "questionmark.circle",
                    description: Text("Essaie d'autres ingrédients")
                )
                .foregroundStyle(AppColors.textSecondary)
            } else {
                List(viewModel.results) { result in
                    resultRow(result)
                        .listRowBackground(AppColors.surface)
                }
                .scrollContentBackground(.hidden)
            }
        }
    }

    private func resultRow(_ result: MatchResult) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(result.cocktail.name)
                    .font(AppTypography.cocktailName)
                    .foregroundStyle(AppColors.textPrimary)

                if !result.missingIngredients.isEmpty {
                    Text("Manque : \(result.missingIngredients.map(\.name).joined(separator: ", "))")
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }
            Spacer()
            Text("\(Int(result.compatibilityScore * 100))%")
                .font(AppTypography.mono)
                .foregroundStyle(result.isFullyAvailable ? AppColors.accentGold : AppColors.textSecondary)
        }
        .padding(.vertical, 4)
    }
}
