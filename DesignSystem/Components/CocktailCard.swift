import SwiftUI

/// Carte cocktail utilisée dans les sections horizontales de l'accueil
/// (Populaires, Nouveautés, Recommandés, Favoris). Pas de photo réelle
/// avant l'intégration des assets (voir README) — le dégradé par famille
/// du Design System sert de placeholder premium en attendant.
struct CocktailCard: View {

    let cocktail: CocktailEntity
    var width: CGFloat = 140

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack(alignment: .bottomLeading) {
                AppColors.gradient(for: cocktail.category)
                    .frame(width: width, height: width * 1.2)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

                Image(systemName: "wineglass.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.white.opacity(0.35))
                    .padding(12)
            }

            Text(cocktail.name)
                .font(AppTypography.label)
                .foregroundStyle(AppColors.textPrimary)
                .lineLimit(1)

            Text(cocktail.category)
                .font(.system(size: 11))
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(width: width)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(cocktail.name)
        .accessibilityHint(cocktail.category)
        .accessibilityAddTraits(.isButton)
    }
}
