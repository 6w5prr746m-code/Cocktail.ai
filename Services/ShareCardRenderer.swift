import SwiftUI
import UIKit

/// Transforme une `ShareCardView` en fichier image exportable, prêt pour
/// le Share Sheet natif iOS (US-E1).
@MainActor
enum ShareCardRenderer {

    enum RenderError: Error {
        case renderingFailed
        case fileWriteFailed
    }

    /// Rend la carte au format demandé et l'écrit dans un fichier temporaire
    /// PNG. On passe par un fichier plutôt que par les données brutes en
    /// mémoire car `ShareLink` reconnaît beaucoup mieux les `URL` de
    /// fichiers image que des `Data` génériques auprès des apps tierces
    /// (Instagram, TikTok...) qui lisent le Share Sheet.
    static func renderToTemporaryFile(
        cocktail: CocktailEntity,
        format: ShareFormat
    ) throws -> (url: URL, previewImage: UIImage) {
        let qrImage = QRCodeGenerator.image(for: QRCodeGenerator.deepLinkURL(forCocktailID: cocktail.id))

        let card = ShareCardView(cocktail: cocktail, format: format, qrCodeImage: qrImage)

        let renderer = ImageRenderer(content: card)
        // Échelle appliquée pour atteindre la résolution d'export cible
        // (1080px de large) à partir de la vue rendue à échelle réduite.
        renderer.scale = format.exportWidth / 540

        guard let uiImage = renderer.uiImage, let pngData = uiImage.pngData() else {
            throw RenderError.renderingFailed
        }

        let fileName = "cocktail-\(cocktail.id.uuidString)-\(format.rawValue.replacingOccurrences(of: " ", with: "_")).png"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

        do {
            try pngData.write(to: url, options: .atomic)
        } catch {
            throw RenderError.fileWriteFailed
        }

        return (url, uiImage)
    }
}
