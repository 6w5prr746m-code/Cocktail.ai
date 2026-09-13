import SwiftUI
import UIKit

/// Composition du visuel de partage — voir Design System §4 (ShareCardView).
/// Fond dégradé de la famille du cocktail, photo HD (placeholder pour
/// l'instant), nom, résumé de recette, QR code en bas à droite.
///
/// Vue "pure" indépendante de tout format d'écran réel : dimensionnée
/// explicitement par le renderer (`ShareCardRenderer`) selon le
/// `ShareFormat` choisi, pas par le layout SwiftUI ambiant.
struct ShareCardView: View {

    let cocktail: CocktailEntity
    let format: ShareFormat
    let qrCodeImage: UIImage?

    private let cardWidth: CGFloat = 540   // rendu à échelle réduite, mis à l'échelle par ImageRenderer

    var body: some View {
        ZStack {
            AppColors.gradient(for: cocktail.category)

            Image(systemName: "wineglass.fill")
                .font(.system(size: cardWidth * 0.4))
                .foregroundStyle(.white.opacity(0.15))

            VStack {
                Spacer()

                VStack(alignment: .leading, spacing: 14) {
                    Text(cocktail.category.uppercased())
                        .font(.system(size: 13, weight: .semibold))
                        .tracking(2)
                        .foregroundStyle(.white.opacity(0.75))

                    Text(cocktail.name)
                        .font(.system(size: 44, weight: .bold, design: .serif))
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    Text(topIngredientsSummary)
                        .font(.system(size: 16))
                        .foregroundStyle(.white.opacity(0.85))
                        .lineLimit(2)

                    HStack {
                        Label("\(cocktail.preparationTimeMinutes) min", systemImage: "clock")
                        Spacer()

                        if let qrCodeImage {
                            VStack(spacing: 4) {
                                Image(uiImage: qrCodeImage)
                                    .interpolation(.none)
                                    .resizable()
                                    .frame(width: 64, height: 64)
                                    .background(Color.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                                Text("Scanner pour la recette")
                                    .font(.system(size: 9))
                            }
                        }
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.75))
                }
                .padding(24)
                .background(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.55)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }

            VStack {
                HStack {
                    Spacer()
                    Text("🍸 Cocktail App")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(10)
                }
                Spacer()
            }
        }
        .frame(width: cardWidth, height: cardWidth / format.aspectRatio)
        .clipped()
    }

    private var topIngredientsSummary: String {
        cocktail.ingredients
            .prefix(3)
            .map(\.ingredient.name)
            .joined(separator: " · ")
    }
}
