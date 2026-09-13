import SwiftUI

/// Carte à effet glassmorphism discret — voir Design System §4.
/// Coins arrondis 20pt, fond translucide flouté, léger halo doré.
struct GlassCard<Content: View>: View {

    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
            .shadow(color: AppColors.accentGold.opacity(0.10), radius: 12, y: 4)
    }
}

#Preview {
    ZStack {
        AppColors.background.ignoresSafeArea()
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Mojito")
                    .font(AppTypography.cocktailName)
                    .foregroundStyle(AppColors.textPrimary)
                Text("Classique · Cuba")
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.textSecondary)
            }
        }
        .padding()
    }
}
