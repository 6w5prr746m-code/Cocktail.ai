import SwiftUI
import SwiftData

/// Fiche cocktail immersive — voir Design System §5.3.
/// Photo (dégradé placeholder) plein écran, swipe vertical, sections
/// ingrédients / préparation / histoire / variantes, CTA "Préparer" fixe.
struct CocktailDetailView: View {

    let modelContext: ModelContext
    @State private var viewModel: CocktailDetailViewModel
    @State private var isShowingEditForm = false
    @State private var isShowingShareSheet = false

    init(cocktailID: UUID, modelContext: ModelContext) {
        self.modelContext = modelContext
        _viewModel = State(
            initialValue: CocktailDetailViewModel(cocktailID: cocktailID, modelContext: modelContext)
        )
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            if let cocktail = viewModel.cocktail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        heroImage(for: cocktail)
                        content(for: cocktail)
                    }
                }
                .scrollIndicators(.hidden)
                .ignoresSafeArea(edges: .top)

                prepareButton
            } else if viewModel.hasAttemptedLoad {
                AppColors.background.ignoresSafeArea()
                ContentUnavailableView(
                    "Cocktail introuvable",
                    systemImage: "questionmark.circle",
                    description: Text("Cette recette a peut-être été supprimée, ou le lien n'est plus valide.")
                )
                .foregroundStyle(AppColors.textSecondary)
            } else {
                AppColors.background.ignoresSafeArea()
                ProgressView().tint(AppColors.accentGold)
            }
        }
        .background(AppColors.background)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 16) {
                    if viewModel.cocktail != nil {
                        Button {
                            isShowingShareSheet = true
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundStyle(.white)
                        }
                    }

                    // Modification réservée aux recettes personnelles (US-D2) —
                    // la bibliothèque de référence n'est pas éditable.
                    if viewModel.cocktail?.isUserCreated == true {
                        Button {
                            isShowingEditForm = true
                        } label: {
                            Image(systemName: "pencil")
                                .foregroundStyle(.white)
                        }
                    }

                    if viewModel.cocktail != nil {
                        Button {
                            viewModel.toggleFavorite()
                        } label: {
                            Image(systemName: viewModel.isFavorite ? "heart.fill" : "heart")
                                .foregroundStyle(viewModel.isFavorite ? AppColors.accentGold : .white)
                        }
                        .accessibilityIdentifier(viewModel.isFavorite ? "heart.fill" : "heart")
                        .accessibilityLabel(viewModel.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris")
                    }
                }
            }
        }
        .onAppear { viewModel.load() }
        .sheet(isPresented: $isShowingEditForm, onDismiss: { viewModel.load() }) {
            RecipeFormView(modelContext: modelContext, existingCocktailID: viewModel.cocktailID)
        }
        .sheet(isPresented: $isShowingShareSheet) {
            if let cocktail = viewModel.cocktail {
                ShareSheetView(cocktail: cocktail)
            }
        }
    }

    // MARK: - Hero

    private func heroImage(for cocktail: CocktailEntity) -> some View {
        ZStack(alignment: .bottomLeading) {
            AppColors.gradient(for: cocktail.category)
                .frame(height: 380)

            Image(systemName: "wineglass.fill")
                .font(.system(size: 90))
                .foregroundStyle(.white.opacity(0.25))
                .frame(maxWidth: .infinity, alignment: .center)
                .frame(height: 380)

            LinearGradient(
                colors: [.clear, AppColors.background],
                startPoint: .center,
                endPoint: .bottom
            )
            .frame(height: 380)

            VStack(alignment: .leading, spacing: 8) {
                Text(cocktail.name)
                    .font(AppTypography.cocktailName)
                    .foregroundStyle(.white)

                HStack(spacing: 16) {
                    Label("\(cocktail.preparationTimeMinutes) min", systemImage: "clock")
                    Label(difficultyLabel(cocktail.difficulty), systemImage: "star.fill")
                }
                .font(AppTypography.label)
                .foregroundStyle(.white.opacity(0.85))
            }
            .padding(20)
        }
    }

    private func difficultyLabel(_ level: Int) -> String {
        switch level {
        case 1: return "Facile"
        case 2: return "Intermédiaire"
        default: return "Difficile"
        }
    }

    // MARK: - Contenu

    private func content(for cocktail: CocktailEntity) -> some View {
        VStack(alignment: .leading, spacing: 28) {
            sectionIngredients(cocktail)
            sectionPreparation(cocktail)
            if let history = cocktail.history, !history.isEmpty {
                sectionHistory(history)
            }
            if !cocktail.variants.isEmpty {
                sectionVariants(cocktail)
            }
            if let tips = cocktail.tips, !tips.isEmpty {
                sectionTips(tips)
            }

            // Espace pour ne pas passer sous le CTA "Préparer" fixe.
            Color.clear.frame(height: 90)
        }
        .padding(20)
    }

    private func sectionIngredients(_ cocktail: CocktailEntity) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Ingrédients")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)

            ForEach(cocktail.ingredients.sorted(by: { $0.ingredient.name < $1.ingredient.name })) { link in
                HStack {
                    Circle()
                        .fill(AppColors.accentGold)
                        .frame(width: 5, height: 5)
                    Text(link.ingredient.name)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.textPrimary)
                    Spacer()
                    Text(quantityLabel(link))
                        .font(AppTypography.mono)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
    }

    private func quantityLabel(_ link: CocktailIngredientEntity) -> String {
        "\(CocktailFormatting.quantityLabel(link.quantity)) \(link.unit)"
    }

    private func sectionPreparation(_ cocktail: CocktailEntity) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Préparation")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)

            ForEach(cocktail.steps.sorted(by: { $0.order < $1.order })) { step in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(step.order)")
                        .font(AppTypography.mono)
                        .foregroundStyle(AppColors.accentGold)
                        .frame(width: 24, alignment: .leading)
                    Text(step.instruction)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.textPrimary)
                }
            }
        }
    }

    private func sectionHistory(_ history: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Histoire")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)
            Text(history)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.textSecondary)
        }
    }

    private func sectionVariants(_ cocktail: CocktailEntity) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Variantes")
                .font(AppTypography.cocktailName.weight(.semibold))
                .foregroundStyle(AppColors.textPrimary)

            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 14) {
                    ForEach(cocktail.variants) { variant in
                        CocktailCard(cocktail: variant, width: 110)
                    }
                }
            }
        }
    }

    private func sectionTips(_ tips: String) -> some View {
        GlassCard {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(AppColors.accentGold)
                Text(tips)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.textPrimary)
            }
        }
    }

    // MARK: - CTA

    private var prepareButton: some View {
        NavigationLink(
            value: AppNavigation.Destination.preparationMode(id: viewModel.cocktailID)
        ) {
            Text("Préparer")
                .font(AppTypography.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(AppColors.background)
                .background(Capsule().fill(AppColors.accentGold))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }
}
