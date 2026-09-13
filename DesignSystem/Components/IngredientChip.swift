import SwiftUI

/// Pastille de sélection d'ingrédient — voir Design System §4.
/// État inactif : contour fin. État actif : fond doré plein + haptique léger.
struct IngredientChip: View {

    let name: String
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            onTap()
        } label: {
            Text(name)
                .font(AppTypography.label)
                .foregroundStyle(isSelected ? AppColors.background : AppColors.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? AppColors.accentGold : Color.clear)
                        .overlay(
                            Capsule()
                                .stroke(isSelected ? Color.clear : AppColors.textSecondary.opacity(0.4), lineWidth: 1)
                        )
                )
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isSelected)
        .accessibilityLabel(name)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
        .accessibilityHint(isSelected ? "Sélectionné. Double-tap pour retirer." : "Double-tap pour sélectionner.")
    }
}

#Preview {
    ZStack {
        AppColors.background.ignoresSafeArea()
        HStack {
            IngredientChip(name: "Vodka", isSelected: true) {}
            IngredientChip(name: "Gin", isSelected: false) {}
        }
    }
}
