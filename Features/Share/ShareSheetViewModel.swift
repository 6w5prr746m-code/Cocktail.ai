import SwiftUI
import UIKit
import Observation

@MainActor
@Observable
final class ShareSheetViewModel {

    let cocktail: CocktailEntity
    var selectedFormat: ShareFormat = .instagramStory
    var renderedFileURL: URL?
    var previewImage: UIImage?
    var isRendering = false
    var renderError: String?

    init(cocktail: CocktailEntity) {
        self.cocktail = cocktail
    }

    func regenerate() {
        isRendering = true
        renderError = nil

        do {
            let result = try ShareCardRenderer.renderToTemporaryFile(cocktail: cocktail, format: selectedFormat)
            renderedFileURL = result.url
            previewImage = result.previewImage
        } catch {
            renderError = "Impossible de générer le visuel. Réessaie."
            renderedFileURL = nil
            previewImage = nil
        }

        isRendering = false
    }
}
