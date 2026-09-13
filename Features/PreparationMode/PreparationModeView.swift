import SwiftUI
import SwiftData
import UIKit

/// Mode préparation plein écran — voir Design System §5.4.
/// Étape par étape, validation par swipe, timer intégré en Liquid Ring,
/// haptique. L'écran reste allumé pendant toute la préparation (US-C1).
struct PreparationModeView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityVoiceOverEnabled) private var isVoiceOverRunning
    @State private var viewModel: PreparationModeViewModel
    @State private var dragOffset: CGFloat = 0

    private let swipeThreshold: CGFloat = 80

    init(cocktailID: UUID, modelContext: ModelContext) {
        _viewModel = State(
            initialValue: PreparationModeViewModel(cocktailID: cocktailID, modelContext: modelContext)
        )
    }

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            if viewModel.isComplete {
                completionView
            } else if let step = viewModel.currentStep {
                stepView(step)
            } else {
                ProgressView().tint(AppColors.accentGold)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .foregroundStyle(.white)
                }
            }
            if !viewModel.isComplete {
                ToolbarItem(placement: .principal) {
                    Text(viewModel.progressLabel)
                        .font(AppTypography.mono)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
        .onAppear {
            viewModel.load()
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onDisappear {
            viewModel.cancelTimers()
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }

    // MARK: - Étape

    private func stepView(_ step: RecipeStepEntity) -> some View {
        VStack(spacing: 40) {
            Spacer()

            Text("Étape \(step.order)")
                .font(AppTypography.label)
                .foregroundStyle(AppColors.textSecondary)

            Text(step.instruction)
                .font(AppTypography.screenTitle)
                .multilineTextAlignment(.center)
                .foregroundStyle(AppColors.textPrimary)
                .padding(.horizontal, 32)

            if let progress = viewModel.timerProgress {
                VStack(spacing: 8) {
                    CompatibilityRing(
                        progress: progress,
                        size: 90,
                        lineWidth: 6,
                        accessibilityDescription: "Temps restant pour cette étape",
                        accessibilityValueOverride: "\(viewModel.timerSecondsRemaining) secondes"
                    )
                    Text(timeLabel(viewModel.timerSecondsRemaining))
                        .font(AppTypography.mono)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            Spacer()

            swipeHint

            // Alternative accessible au swipe (US-C1) : un geste de swipe
            // horizontal personnalisé entre en conflit avec la navigation
            // gestuelle de VoiceOver, qui utilise déjà le swipe pour se
            // déplacer entre éléments. On expose donc une action au rotor
            // VoiceOver (ci-dessous, `.accessibilityAction`) et, seulement
            // quand VoiceOver tourne, un vrai bouton visible — le reste du
            // temps, l'expérience swipe reste épurée comme voulu au brief.
            if isVoiceOverRunning {
                Button {
                    withAnimation(.easeOut(duration: 0.2)) { dragOffset = 500 }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                        viewModel.advance()
                        dragOffset = 0
                    }
                } label: {
                    Text("Valider l'étape")
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.accentGold)
                }
                .padding(.bottom, 20)
            }
        }
        .offset(x: dragOffset)
        .accessibilityElement(children: .combine)
        .accessibilityAction(named: "Valider l'étape") {
            viewModel.advance()
        }
        .gesture(
            DragGesture()
                .onChanged { value in
                    // On ne réagit qu'au swipe horizontal, pour ne pas
                    // interférer avec le scroll vertical natif d'iOS.
                    dragOffset = value.translation.width
                }
                .onEnded { value in
                    if abs(value.translation.width) > swipeThreshold {
                        withAnimation(.easeOut(duration: 0.2)) {
                            dragOffset = value.translation.width > 0 ? 500 : -500
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            viewModel.advance()
                            dragOffset = 0
                        }
                    } else {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            dragOffset = 0
                        }
                    }
                }
        )
    }

    private var swipeHint: some View {
        HStack(spacing: 8) {
            Image(systemName: "arrow.left")
            Text("swipe pour valider")
            Image(systemName: "arrow.right")
        }
        .font(AppTypography.label)
        .foregroundStyle(AppColors.textSecondary.opacity(0.6))
        .padding(.bottom, 40)
    }

    private func timeLabel(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }

    // MARK: - Fin

    private var completionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(AppColors.accentGold)

            Text("Ton cocktail est prêt !")
                .font(AppTypography.screenTitle)
                .foregroundStyle(AppColors.textPrimary)
                .multilineTextAlignment(.center)

            if let name = viewModel.cocktail?.name {
                Text(name)
                    .font(AppTypography.cocktailName)
                    .foregroundStyle(AppColors.accentGold)
            }

            Button {
                dismiss()
            } label: {
                Text("Terminer")
                    .font(AppTypography.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .foregroundStyle(AppColors.background)
                    .background(Capsule().fill(AppColors.accentGold))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 40)
            .padding(.top, 20)
        }
        .padding()
    }
}
