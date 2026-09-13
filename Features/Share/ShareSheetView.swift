import SwiftUI
import UIKit
import SwiftData

/// Écran de partage (US-E1) : choix du format, aperçu en direct, partage
/// via le Share Sheet natif iOS (`ShareLink`).
struct ShareSheetView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: ShareSheetViewModel

    init(cocktail: CocktailEntity) {
        _viewModel = State(initialValue: ShareSheetViewModel(cocktail: cocktail))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 24) {
                    formatPicker
                    preview
                    Spacer()
                    shareButton
                }
                .padding()
            }
            .navigationTitle("Partager")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
            .onAppear { viewModel.regenerate() }
            .onChange(of: viewModel.selectedFormat) { viewModel.regenerate() }
        }
    }

    private var formatPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(ShareFormat.allCases) { format in
                    Button {
                        viewModel.selectedFormat = format
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: format.iconName)
                                .font(.system(size: 20))
                            Text(format.rawValue)
                                .font(.system(size: 11))
                        }
                        .frame(width: 84, height: 64)
                        .foregroundStyle(
                            viewModel.selectedFormat == format ? AppColors.background : AppColors.textPrimary
                        )
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(viewModel.selectedFormat == format ? AppColors.accentGold : AppColors.surface)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private var preview: some View {
        if viewModel.isRendering {
            ProgressView().tint(AppColors.accentGold)
                .frame(maxHeight: .infinity)
        } else if let previewImage = viewModel.previewImage {
            Image(uiImage: previewImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 420)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .shadow(color: AppColors.accentGold.opacity(0.15), radius: 20, y: 8)
        } else if let renderError = viewModel.renderError {
            Text(renderError)
                .foregroundStyle(AppColors.textSecondary)
        }
    }

    @ViewBuilder
    private var shareButton: some View {
        if let fileURL = viewModel.renderedFileURL {
            ShareLink(
                item: fileURL,
                preview: SharePreview(
                    "\(viewModel.cocktail.name) — Cocktail App",
                    image: Image(uiImage: viewModel.previewImage ?? UIImage())
                )
            ) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Partager ce visuel")
                        .font(AppTypography.body.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(AppColors.background)
                .background(Capsule().fill(AppColors.accentGold))
            }
        }
    }
}
