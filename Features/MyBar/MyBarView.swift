import SwiftUI
import SwiftData

/// Écran "Mon Bar" (Sprint My Bar 2.0). Aucune logique métier ici — tout
/// passe par `MyBarViewModel` (filtrage, ajout/retrait, calcul du nombre
/// de cocktails débloqués via le Matching Engine). Cette Vue ne fait que
/// lire l'état du ViewModel et lui déléguer chaque action.
struct MyBarView: View {

    let modelContext: ModelContext
    let matchingEngine: MatchingEngineProtocol
    @State private var viewModel: MyBarViewModel
    @State private var editingQuantityFor: IngredientEntity?
    @State private var quantityDraft: String = ""

    init(modelContext: ModelContext, matchingEngine: MatchingEngineProtocol) {
        self.modelContext = modelContext
        self.matchingEngine = matchingEngine
        _viewModel = State(
            initialValue: MyBarViewModel(modelContext: modelContext, matchingEngine: matchingEngine)
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        readinessHeader
                        searchAndFilters

                        if !viewModel.myBarEntries.isEmpty {
                            ownedSection
                        }

                        addSection
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Mon Bar")
            .onAppear { viewModel.load() }
            .sheet(item: $editingQuantityFor) { ingredient in
                quantitySheet(for: ingredient)
            }
        }
    }

    // MARK: - En-tête d'état (US : "bar presque prêt" / "excellent bar")

    private var readinessHeader: some View {
        GlassCard {
            HStack(spacing: 16) {
                let ringProgress = min(
                    Double(viewModel.unlockedCocktailCount) / Double(BarReadiness.excellentThreshold),
                    1.0
                )
                CompatibilityRing(
                    progress: ringProgress,
                    size: 64,
                    lineWidth: 5,
                    accessibilityDescription: "Cocktails entièrement réalisables avec ton bar",
                    accessibilityValueOverride: "\(viewModel.unlockedCocktailCount)",
                    visualLabelOverride: "\(viewModel.unlockedCocktailCount)"
                )

                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.barReadiness.title)
                        .font(AppTypography.cocktailName.weight(.semibold))
                        .foregroundStyle(AppColors.textPrimary)
                    Text(viewModel.barReadiness.subtitle)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.textSecondary)

                    if viewModel.almostUnlockedCocktailCount > 0 {
                        Text("+ \(viewModel.almostUnlockedCocktailCount) presque accessibles")
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(AppColors.accentGold)
                    }
                }
            }
        }
        .padding(.horizontal)
        .accessibilityElement(children: .combine)
    }

    // MARK: - Recherche et filtre par catégorie

    private var searchAndFilters: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(AppColors.textSecondary)
                TextField("Rechercher un ingrédient…", text: $viewModel.searchText)
                    .foregroundStyle(AppColors.textPrimary)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(AppColors.surface))
            .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    IngredientChip(name: "Tout", isSelected: viewModel.selectedCategory == nil) {
                        viewModel.selectedCategory = nil
                    }
                    ForEach(viewModel.availableCategories, id: \.self) { category in
                        IngredientChip(name: category, isSelected: viewModel.selectedCategory == category) {
                            viewModel.selectedCategory = viewModel.selectedCategory == category ? nil : category
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Ingrédients déjà présents

    private var ownedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Déjà dans ton bar (\(viewModel.myBarEntries.count))")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)
                .padding(.horizontal)

            VStack(spacing: 10) {
                ForEach(viewModel.myBarEntries) { item in
                    ownedRow(item)
                }
            }
            .padding(.horizontal)
        }
    }

    private func ownedRow(_ item: MyBarEntry) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.ingredient.name)
                            .font(AppTypography.body.weight(.semibold))
                            .foregroundStyle(AppColors.textPrimary)
                        if let quantity = item.entry.approximateQuantity, !quantity.isEmpty {
                            Text(quantity)
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.textSecondary)
                        }
                    }

                    Spacer()

                    Button {
                        quantityDraft = item.entry.approximateQuantity ?? ""
                        editingQuantityFor = item.ingredient
                    } label: {
                        Image(systemName: "pencil.circle")
                            .foregroundStyle(AppColors.textSecondary)
                    }
                    .accessibilityLabel("Modifier la quantité approximative de \(item.ingredient.name)")

                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                            viewModel.remove(item.ingredient)
                        }
                    } label: {
                        Image(systemName: "trash")
                            .foregroundStyle(.red.opacity(0.8))
                    }
                    .accessibilityLabel("Retirer \(item.ingredient.name) de Mon Bar")
                }

                HStack(spacing: 8) {
                    ForEach(StockStatus.allCases) { status in
                        IngredientChip(
                            name: status.label,
                            isSelected: item.entry.stockStatus == status
                        ) {
                            viewModel.updateStockStatus(item.ingredient, to: status)
                        }
                    }
                }
            }
        }
        .transition(.opacity.combined(with: .scale(scale: 0.95)))
    }

    // MARK: - Ajout d'ingrédients

    private var addSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ajouter des ingrédients")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)
                .padding(.horizontal)

            if viewModel.filteredCatalog.isEmpty {
                ContentUnavailableView(
                    "Aucun ingrédient trouvé",
                    systemImage: "magnifyingglass",
                    description: Text("Essaie une autre recherche ou catégorie.")
                )
                .foregroundStyle(AppColors.textSecondary)
            } else {
                FlowLayout(spacing: 8) {
                    ForEach(viewModel.filteredCatalog) { ingredient in
                        IngredientChip(
                            name: ingredient.name,
                            isSelected: viewModel.ownedIngredientIDs.contains(ingredient.id)
                        ) {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                viewModel.toggle(ingredient)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Sheet quantité approximative

    private func quantitySheet(for ingredient: IngredientEntity) -> some View {
        NavigationStack {
            Form {
                Section("Quantité approximative") {
                    TextField("ex: environ 1 bouteille, 3/4 restant…", text: $quantityDraft)
                }
            }
            .navigationTitle(ingredient.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { editingQuantityFor = nil }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Enregistrer") {
                        viewModel.updateApproximateQuantity(ingredient, to: quantityDraft)
                        editingQuantityFor = nil
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium])
    }
}
