import SwiftUI
import SwiftData

/// Onglet Profil : section Historique (US "cocktails déjà réalisés") +
/// accès aux outils de debug des sprints précédents. L'écran de profil
/// utilisateur à proprement parler (avatar, réglages...) n'est pas prévu
/// avant une itération ultérieure — non présent dans le PRD actuel.
struct ProfileView: View {

    let modelContext: ModelContext
    @State private var viewModel: ProfileViewModel

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        _viewModel = State(initialValue: ProfileViewModel(modelContext: modelContext))
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter
    }()

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                List {
                    Section("Historique") {
                        if viewModel.historyEntries.isEmpty {
                            Text("Aucun cocktail préparé pour l'instant.")
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.textSecondary)
                                .listRowBackground(AppColors.surface)
                        } else {
                            ForEach(viewModel.historyEntries) { entry in
                                NavigationLink(
                                    value: AppNavigation.Destination.cocktailDetail(id: entry.cocktail.id)
                                ) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(entry.cocktail.name)
                                                .font(AppTypography.body)
                                                .foregroundStyle(AppColors.textPrimary)
                                            Text(Self.dateFormatter.string(from: entry.preparedAt))
                                                .font(.system(size: 12))
                                                .foregroundStyle(AppColors.textSecondary)
                                        }
                                    }
                                }
                                .listRowBackground(AppColors.surface)
                            }
                        }
                    }

                    Section("Outils de debug") {
                        NavigationLink("🧪 Debug — Moteur de matching") {
                            MatchingDebugView(modelContext: modelContext)
                        }
                        .listRowBackground(AppColors.surface)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Profil")
            .navigationDestination(for: AppNavigation.Destination.self) { destination in
                destinationView(for: destination, modelContext: modelContext)
            }
        }
        .onAppear { viewModel.load() }
    }
}
