import SwiftUI
import SwiftData

/// Écran d'accueil — voir Design System §5.1.
/// "Que souhaites-tu boire ce soir ?" + CTA principal + 4 sections
/// horizontales, jamais de page vide (US-F1, US-F2).
struct HomeView: View {

    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: HomeViewModel

    init(modelContext: ModelContext) {
        _viewModel = State(initialValue: HomeViewModel(modelContext: modelContext))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {
                hero
                section(title: "Populaires", cocktails: viewModel.popularCocktails)
                section(title: "Nouveautés", cocktails: viewModel.newCocktails)
                section(title: "Recommandés pour toi", cocktails: viewModel.recommendedCocktails)
                favoritesSection
            }
            .padding(.bottom, 32)
        }
        .background(AppColors.background.ignoresSafeArea())
        .scrollIndicators(.hidden)
        .onAppear { viewModel.loadSections() }
        .sheet(isPresented: $viewModel.isShowingIngredientPicker) {
            IngredientPickerView(modelContext: modelContext)
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Que souhaites-tu\nboire ce soir ?")
                .font(AppTypography.screenTitle)
                .foregroundStyle(AppColors.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                viewModel.isShowingIngredientPicker = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Ajouter mes ingrédients")
                        .font(AppTypography.body.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(AppColors.background)
                .background(
                    Capsule().fill(AppColors.accentGold)
                )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal)
        .padding(.top, 12)
    }

    @ViewBuilder
    private func section(title: String, cocktails: [CocktailEntity]) -> some View {
        if !cocktails.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(title)
                        .font(AppTypography.cocktailName.weight(.semibold))
                        .foregroundStyle(AppColors.textPrimary)
                    Spacer()
                    Text("Voir tout")
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.accentGold)
                }
                .padding(.horizontal)

                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 14) {
                        ForEach(cocktails) { cocktail in
                            NavigationLink(value: AppNavigation.Destination.cocktailDetail(id: cocktail.id)) {
                                CocktailCard(cocktail: cocktail)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }

    @ViewBuilder
    private var favoritesSection: some View {
        if viewModel.favoriteCocktails.isEmpty {
            // Règle "aucune page vide" (brief) : on explique plutôt
            // qu'on cache la section. Les favoris eux-mêmes arrivent
            // au Sprint 5.
            VStack(alignment: .leading, spacing: 8) {
                Text("Tes favoris")
                    .font(AppTypography.cocktailName.weight(.semibold))
                    .foregroundStyle(AppColors.textPrimary)
                Text("Ajoute un cocktail à tes favoris pour le retrouver ici.")
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.textSecondary)
            }
            .padding(.horizontal)
        } else {
            section(title: "Tes favoris", cocktails: viewModel.favoriteCocktails)
        }
    }
}
