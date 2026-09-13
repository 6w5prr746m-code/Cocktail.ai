import Foundation

/// Formats de visuel proposés au partage (PRD : Instagram Story/Post,
/// TikTok, Pinterest, Snapchat). Chaque format a un ratio d'aspect propre
/// — le contenu de la carte reste identique, seule la mise en page varie.
enum ShareFormat: String, CaseIterable, Identifiable {
    case instagramStory = "Story Instagram"
    case instagramPost = "Post Instagram"
    case tiktok = "TikTok"
    case pinterest = "Pinterest"
    case snapchat = "Snapchat"

    var id: String { rawValue }

    /// Ratio largeur:hauteur.
    var aspectRatio: CGFloat {
        switch self {
        case .instagramStory, .tiktok, .snapchat: return 9.0 / 16.0
        case .instagramPost: return 4.0 / 5.0
        case .pinterest: return 2.0 / 3.0
        }
    }

    /// Résolution d'export en pixels (largeur), à @2x pour un rendu net
    /// sur les réseaux sociaux.
    var exportWidth: CGFloat { 1080 }

    var exportHeight: CGFloat { exportWidth / aspectRatio }

    var iconName: String {
        switch self {
        case .instagramStory, .instagramPost: return "camera.circle.fill"
        case .tiktok: return "music.note.tv.fill"
        case .pinterest: return "pin.circle.fill"
        case .snapchat: return "bolt.circle.fill"
        }
    }
}
