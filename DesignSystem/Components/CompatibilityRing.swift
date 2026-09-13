import SwiftUI

/// Le "Liquid Ring" — signature visuelle de l'app (voir Design System §1
/// et §4). Anneau dont le remplissage évoque un niveau de liquide qui
/// monte de 0 à 100%. Réutilisé ici pour le score de compatibilité, et
/// plus tard pour le timer du mode préparation (Sprint 4).
struct CompatibilityRing: View {

    /// Valeur de 0.0 à 1.0.
    let progress: Double
    var size: CGFloat = 44
    var lineWidth: CGFloat = 4

    /// Description lue par VoiceOver avant le pourcentage (ex: "Score de
    /// compatibilité" ou "Temps restant"), pour que l'anneau ait un sens
    /// hors contexte visuel. Par défaut adapté au cas d'usage le plus
    /// courant (score de compatibilité recherche magique).
    var accessibilityDescription: String = "Score de compatibilité"

    /// Permet de remplacer la valeur par défaut ("X pour cent") par un
    /// libellé plus parlant selon le contexte — ex: "12 secondes restantes"
    /// pour le timer du mode préparation, plutôt qu'un pourcentage abstrait.
    var accessibilityValueOverride: String?

    /// Permet de remplacer le texte affiché *visuellement* au centre de
    /// l'anneau (par défaut "X%") — ex: "5" pour afficher un nombre brut
    /// de cocktails débloqués dans Mon Bar plutôt qu'un pourcentage qui
    /// n'aurait pas de sens dans ce contexte. Additif et rétrocompatible :
    /// tous les appels existants (recherche magique, timer) continuent
    /// d'afficher le pourcentage par défaut sans rien changer.
    var visualLabelOverride: String?

    private var ringColor: Color {
        // Doré à 100%, dérive doucement vers un gris neutre quand le score baisse.
        progress >= 1.0 ? AppColors.accentGold : AppColors.accentGold.opacity(0.4 + progress * 0.6)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(AppColors.textSecondary.opacity(0.2), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    ringColor,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.5, dampingFraction: 0.8), value: progress)

            Text(visualLabelOverride ?? "\(Int(progress * 100))%")
                .font(.system(size: size * 0.28, weight: .semibold, design: .monospaced))
                .foregroundStyle(AppColors.textPrimary)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityDescription)
        .accessibilityValue(accessibilityValueOverride ?? "\(Int(progress * 100)) pour cent")
    }
}

#Preview {
    ZStack {
        AppColors.background.ignoresSafeArea()
        HStack(spacing: 20) {
            CompatibilityRing(progress: 1.0)
            CompatibilityRing(progress: 0.92)
            CompatibilityRing(progress: 0.6)
        }
    }
}
