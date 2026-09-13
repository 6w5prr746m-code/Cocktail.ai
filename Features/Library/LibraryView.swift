import SwiftUI
import SwiftData

/// Écran Bibliothèque — recherche multicritère (US-B2) + collections
/// thématiques (US-B3). Voir note sur le filtre "couleur" dans
/// LibraryViewModel.
struct LibraryView: View {

    let modelContext: ModelContext
    @State private var viewModel: LibraryViewModel
    @State private var isShowingFilters = false
    @State private var isShowingCreateRecipe = false

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        _viewModel = State(initialValue: LibraryViewModel(modelContext: modelContext))
    }

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    searchField

                    if !viewModel.hasActiveFilters {
                        collectionsSection
                    }

                    resultsSection
                }
                .padding(.vertical)
            }
        }
        .navigationTitle("Bibliothèque")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isShowingCreateRecipe = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(AppColors.accentGold)
                }
            }
        }
        .onAppear { viewModel.load() }
        .sheet(isPresented: $isShowingFilters) {
            FiltersSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $isShowingCreateRecipe, onDismiss: { viewModel.load() }) {
            RecipeFormView(modelContext: modelContext)
        }
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(AppColors.textSecondary)
                TextField("Nom ou ingrédient…", text: $viewModel.searchText)
                    .foregroundStyle(AppColors.textPrimary)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(AppColors.surface))

            Button {
                isShowingFilters = true
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .foregroundStyle(viewModel.hasActiveFilters ? AppColors.background : AppColors.textPrimary)
                    .padding(12)
                    .background(
                        Circle().fill(viewModel.hasActiveFilters ? AppColors.accentGold : AppColors.surface)
                    )
            }
        }
        .padding(.horizontal)
    }

    private var collectionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Collections")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)
                .padding(.horizontal)

            if viewModel.collections.isEmpty {
                Text("Les collections thématiques arrivent avec l'enrichissement de la bibliothèque.")
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.textSecondary)
                    .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 14) {
                        ForEach(viewModel.collections) { collection in
                            NavigationLink(
                                value: AppNavigation.Destination.collection(id: collection.id)
                            ) {
                                CollectionCard(collection: collection)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(viewModel.hasActiveFilters ? "Résultats" : "Tous les cocktails")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)
                .padding(.horizontal)

            if viewModel.filteredCocktails.isEmpty {
                ContentUnavailableView(
                    "Aucun résultat",
                    systemImage: "magnifyingglass",
                    description: Text("Essaie d'autres critères de recherche.")
                )
                .foregroundStyle(AppColors.textSecondary)
                .padding(.top, 20)
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 14)], spacing: 14) {
                    ForEach(viewModel.filteredCocktails) { cocktail in
                        NavigationLink(value: AppNavigation.Destination.cocktailDetail(id: cocktail.id)) {
                            CocktailCard(cocktail: cocktail, width: 150)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

/// Carte de collection — dégradé neutre + icône SF Symbol + nombre de cocktails.
private struct CollectionCard: View {
    let collection: CollectionEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                LinearGradient(
                    colors: [AppColors.accentGold.opacity(0.5), AppColors.surface],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(width: 130, height: 90)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                Image(systemName: collection.iconName)
                    .font(.system(size: 26))
                    .foregroundStyle(.white)
            }

            Text(collection.name)
                .font(AppTypography.label)
                .foregroundStyle(AppColors.textPrimary)
                .lineLimit(1)

            Text("\(collection.cocktails.count) cocktails")
                .font(.system(size: 11))
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(width: 130)
    }
}

/// Sheet de filtres — chips à sélection multiple pour alcool, difficulté, occasion.
private struct FiltersSheet: View {
    @Environment(\.dismiss) private var dismiss
    var viewModel: LibraryViewModel

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        filterGroup(
                            title: "Alcool principal",
                            options: viewModel.availableSpirits,
                            isSelected: { viewModel.selectedSpirits.contains($0) },
                            onToggle: { viewModel.toggleSpirit($0) }
                        )

                        VStack(alignment: .leading, spacing: 10) {
                            Text("Difficulté")
                                .font(AppTypography.cocktailName.weight(.semibold))
                                .foregroundStyle(AppColors.textPrimary)
                            HStack(spacing: 8) {
                                ForEach([1, 2, 3], id: \.self) { level in
                                    IngredientChip(
                                        name: difficultyLabel(level),
                                        isSelected: viewModel.selectedDifficulties.contains(level)
                                    ) {
                                        viewModel.toggleDifficulty(level)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)

                        filterGroup(
                            title: "Occasion",
                            options: viewModel.availableOccasions,
                            isSelected: { viewModel.selectedOccasions.contains($0) },
                            onToggle: { viewModel.toggleOccasion($0) }
                        )
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Filtres")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Réinitialiser") { viewModel.clearFilters() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") { dismiss() }
                }
            }
        }
    }

    private func filterGroup(
        title: String,
        options: [String],
        isSelected: @escaping (String) -> Bool,
        onToggle: @escaping (String) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)

            FlowLayout(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    IngredientChip(name: option, isSelected: isSelected(option)) {
                        onToggle(option)
                    }
                }
            }
        }
        .padding(.horizontal)
    }

    private func difficultyLabel(_ level: Int) -> String {
        switch level {
        case 1: return "Facile"
        case 2: return "Intermédiaire"
        default: return "Difficile"
        }
    }
}

/// Layout simple à retour à la ligne pour les chips de filtre — voir
/// `DesignSystem/Components/FlowLayout.swift` (extrait ici au Sprint My Bar
/// 2.0 pour être partagé avec l'écran Mon Bar).
