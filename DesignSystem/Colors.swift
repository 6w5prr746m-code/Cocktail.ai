import SwiftUI
import UIKit

/// Tokens de couleur — voir doc Design System & Wireframes, §2.
/// Toute couleur utilisée dans l'app doit passer par ces tokens plutôt
/// que par des Color(hex:) ad-hoc dans les Views, pour garder une
/// cohérence totale et faciliter une éventuelle re-thématisation.
///
/// Support Light Mode (Sprint 9) : chaque token neutre est adossé à un
/// `UIColor` dynamique qui bascule selon `traitCollection.userInterfaceStyle`.
/// Ce choix (plutôt qu'un `@Environment(\.colorScheme)` propagé manuellement)
/// fait que les tokens statiques `AppColors.xxx` restent utilisables tels
/// quels dans tout le code existant (Views, previews, DesignSystem) sans
/// aucun changement d'API — la bascule est gérée par UIKit en interne.
/// Le doré (`accentGold`) reste identique dans les deux modes : c'est une
/// couleur de marque, pas une couleur d'interface.
enum AppColors {
    static let background = Color.dynamic(light: "#F5F1E8", dark: "#0B0B0F")
    static let surface = Color.dynamic(light: "#EDE7D9", dark: "#16161C")
    static let textPrimary = Color.dynamic(light: "#0B0B0F", dark: "#F5F1E8")
    static let textSecondary = Color.dynamic(light: "#6B6560", dark: "#A8A5A0")
    static let accentGold = Color(hex: "#C9A227")
    static let accentGoldSoft = Color(hex: "#E8D9A8")

    /// Dégradés dynamiques par famille de cocktail — voir Design System §2.
    /// Restent identiques en light/dark : ce sont des accents de contenu
    /// (photo/ambiance du cocktail), pas des couleurs d'interface neutre.
    static func gradient(for category: String) -> LinearGradient {
        let colors: [Color]
        switch category.lowercased() {
        case "tropical", "tiki":
            colors = [Color(hex: "#FF7A59"), Color(hex: "#2DD4BF")]
        case "classique", "spiritueux":
            colors = [Color(hex: "#C9A227"), Color(hex: "#5B2A2A")]
        case "frais", "menthe":
            colors = [Color(hex: "#2DD4BF"), Color(hex: "#0B0B0F")]
        case "agrumes":
            colors = [Color(hex: "#FFD166"), Color(hex: "#EF476F")]
        case "sans alcool":
            colors = [Color(hex: "#8AC6D1"), Color(hex: "#F5F1E8")]
        case "hiver", "fêtes":
            colors = [Color(hex: "#5B2A2A"), Color(hex: "#C9A227")]
        default:
            colors = [Color(hex: "#C9A227"), Color(hex: "#0B0B0F")]
        }
        return LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

extension Color {
    /// Initialiseur pratique pour créer une Color depuis un hex "#RRGGBB".
    init(hex: String) {
        let sanitized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var rgb: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&rgb)

        let r = Double((rgb >> 16) & 0xFF) / 255
        let g = Double((rgb >> 8) & 0xFF) / 255
        let b = Double(rgb & 0xFF) / 255

        self.init(red: r, green: g, blue: b)
    }

    /// Couleur qui bascule automatiquement entre une valeur claire et une
    /// valeur sombre selon l'apparence système courante.
    static func dynamic(light: String, dark: String) -> Color {
        Color(uiColor: UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

extension UIColor {
    convenience init(hex: String) {
        let sanitized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var rgb: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&rgb)

        let r = CGFloat((rgb >> 16) & 0xFF) / 255
        let g = CGFloat((rgb >> 8) & 0xFF) / 255
        let b = CGFloat(rgb & 0xFF) / 255

        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}
