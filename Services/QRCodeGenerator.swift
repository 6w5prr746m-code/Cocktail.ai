import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI
import UIKit

/// Génère un QR code menant directement à la fiche recette (US-E1 :
/// "QR Code ouvrant directement la recette").
///
/// Le deep link généré ici (`cocktailapp://cocktail/<id>`) est résolu par
/// `DeepLink.swift` et branché dans `CocktailApp.swift` via `.onOpenURL`
/// depuis le Sprint 12 — fonctionnel de bout en bout. Rappel Xcode : le
/// scheme `cocktailapp` doit être déclaré dans la cible (Info → URL
/// Types) pour que le système route ces liens vers l'app (voir README).
enum QRCodeGenerator {

    static func deepLinkURL(forCocktailID id: UUID) -> URL {
        URL(string: "cocktailapp://cocktail/\(id.uuidString)")!
    }

    static func image(for url: URL, sizePoints: CGFloat = 120) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(url.absoluteString.utf8)
        filter.correctionLevel = "M"

        guard let outputImage = filter.outputImage else { return nil }

        // Le QR code généré est minuscule (quelques dizaines de pixels) —
        // on le met à l'échelle sans flou en désactivant l'interpolation.
        let scale = sizePoints / outputImage.extent.width
        let scaled = outputImage.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
