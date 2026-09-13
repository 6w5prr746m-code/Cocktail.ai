import SwiftUI
import SwiftData
import Observation

/// ViewModel du mode préparation — voir Design System §5.4 et PRD US-C1/US-C2.
/// Gère la progression étape par étape et le minuteur des étapes chronométrées.
@MainActor
@Observable
final class PreparationModeViewModel {

    private let modelContext: ModelContext
    let cocktailID: UUID

    var cocktail: CocktailEntity?
    var orderedSteps: [RecipeStepEntity] = []
    var currentStepIndex: Int = 0

    /// Progression du timer de l'étape courante, de 0.0 à 1.0 — alimente
    /// le Liquid Ring. `nil` si l'étape n'a pas de durée.
    var timerProgress: Double?
    var timerSecondsRemaining: Int = 0

    var isComplete: Bool = false

    private var timerTask: Task<Void, Never>?

    var currentStep: RecipeStepEntity? {
        guard orderedSteps.indices.contains(currentStepIndex) else { return nil }
        return orderedSteps[currentStepIndex]
    }

    var progressLabel: String {
        "\(currentStepIndex + 1) / \(orderedSteps.count)"
    }

    init(cocktailID: UUID, modelContext: ModelContext) {
        self.cocktailID = cocktailID
        self.modelContext = modelContext
    }

    func load() {
        let descriptor = FetchDescriptor<CocktailEntity>(
            predicate: #Predicate { $0.id == cocktailID }
        )
        cocktail = try? modelContext.fetch(descriptor).first
        orderedSteps = (cocktail?.steps ?? []).sorted { $0.order < $1.order }
        currentStepIndex = 0
        isComplete = false
        startTimerIfNeeded()
    }

    /// Appelé par le swipe de validation (US-C1). Avance à l'étape
    /// suivante, ou marque la préparation comme terminée.
    func advance() {
        timerTask?.cancel()

        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        guard currentStepIndex + 1 < orderedSteps.count else {
            isComplete = true
            recordHistoryEntry()
            return
        }

        currentStepIndex += 1
        startTimerIfNeeded()
    }

    /// Enregistre la préparation dans l'historique (US : "Historique des
    /// cocktails déjà réalisés"). Voir FavoriteEntity.swift pour le
    /// raisonnement sur `cocktailID` plutôt qu'une relation directe.
    private func recordHistoryEntry() {
        let entry = HistoryEntryEntity(cocktailID: cocktailID)
        modelContext.insert(entry)
        try? modelContext.save()
    }

    func cancelTimers() {
        timerTask?.cancel()
    }

    private func startTimerIfNeeded() {
        timerTask?.cancel()
        timerProgress = nil

        guard let duration = currentStep?.durationSeconds, duration > 0 else {
            return
        }

        timerSecondsRemaining = duration
        timerProgress = 0

        timerTask = Task { [weak self] in
            guard let self else { return }
            let totalSeconds = duration
            var elapsed = 0

            while elapsed < totalSeconds {
                if Task.isCancelled { return }
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                elapsed += 1
                self.timerSecondsRemaining = totalSeconds - elapsed
                self.timerProgress = Double(elapsed) / Double(totalSeconds)
            }

            // Fin du minuteur : vibration de fin distincte du swipe manuel.
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        }
    }
}
