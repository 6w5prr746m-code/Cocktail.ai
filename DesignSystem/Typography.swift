import SwiftUI

/// Échelle typographique — voir doc Design System & Wireframes, §3.
/// Display = New York (serif Apple), corps = SF Pro Text, chiffres = SF Mono.
///
/// Support Dynamic Type (Sprint 9) : les tailles fixes du Sprint 0
/// (`.system(size: 34, ...)`) ne s'agrandissaient pas avec les réglages
/// d'accessibilité du système. Chaque token est maintenant construit sur
/// un **style de texte sémantique** (`.largeTitle`, `.title`, `.body`...)
/// plutôt qu'une taille en points fixe : ces styles s'adaptent
/// automatiquement à la taille de texte choisie par l'utilisateur dans
/// Réglages, sans rien changer aux Views qui consomment `AppTypography`.
enum AppTypography {
    static let screenTitle = Font.system(.largeTitle, design: .serif, weight: .bold)
    static let cocktailName = Font.system(.title, design: .serif, weight: .semibold)
    static let body = Font.system(.body, design: .default)
    static let label = Font.system(.footnote, design: .default, weight: .medium)
    static let mono = Font.system(.title3, design: .monospaced, weight: .medium)
}
