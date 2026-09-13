import SwiftUI
import SwiftData

@main
struct CocktailApp: App {

    let container: AppContainer

    init() {
        self.container = AppContainer()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container.navigation)
                .environment(container)
                .task {
                    await container.bootstrap()
                }
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
        .modelContainer(container.modelContainer)
    }

    /// Résout un deep link entrant (QR code de partage, tap sur le widget)
    /// vers une navigation réelle — voir DeepLink.swift pour le format
    /// d'URL supporté. Le lien pousse toujours sur l'onglet Accueil, en
    /// remplaçant sa pile de navigation courante plutôt qu'en empilant
    /// par-dessus un état de navigation potentiellement déjà profond.
    private func handleDeepLink(_ url: URL) {
        guard let destination = DeepLink.destination(for: url) else { return }

        container.navigation.selectedTab = .home
        container.navigation.homePath = NavigationPath()
        container.navigation.homePath.append(destination)
    }
}

/// Structure principale à onglets — voir Architecture Technique §5.
/// Accueil, Bibliothèque, Mon Bar, Favoris et Profil ont un vrai contenu
/// produit (Sprint My Bar 2.0).
struct RootView: View {

    @Environment(\.modelContext) private var modelContext
    @Environment(AppNavigation.self) private var navigation
    @Environment(AppContainer.self) private var container

    var body: some View {
        @Bindable var navigation = navigation

        TabView(selection: $navigation.selectedTab) {
            NavigationStack(path: $navigation.homePath) {
                HomeView(modelContext: modelContext)
                    .navigationDestination(for: AppNavigation.Destination.self) { destination in
                        destinationView(for: destination, modelContext: modelContext)
                    }
            }
            .tabItem { Label("Accueil", systemImage: "house.fill") }
            .tag(AppNavigation.Tab.home)

            NavigationStack(path: $navigation.libraryPath) {
                LibraryView(modelContext: modelContext)
                    .navigationDestination(for: AppNavigation.Destination.self) { destination in
                        destinationView(for: destination, modelContext: modelContext)
                    }
            }
            .tabItem { Label("Bibliothèque", systemImage: "books.vertical.fill") }
            .tag(AppNavigation.Tab.library)

            MyBarView(modelContext: modelContext, matchingEngine: container.matchingEngine)
                .tabItem { Label("Mon Bar", systemImage: "wineglass.fill") }
                .tag(AppNavigation.Tab.myBar)

            FavoritesView(modelContext: modelContext)
                .tabItem { Label("Favoris", systemImage: "heart.fill") }
                .tag(AppNavigation.Tab.favorites)

            ProfileView(modelContext: modelContext)
                .tabItem { Label("Profil", systemImage: "person.fill") }
                .tag(AppNavigation.Tab.profile)
        }
        .tint(AppColors.accentGold)
    }
}

/// Placeholder générique pour les onglets pas encore développés — respecte
/// la règle "aucune page vide" en expliquant clairement ce qui arrive.
private struct PlaceholderTabView: View {
    let title: String
    let sprint: String

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()
                ContentUnavailableView(
                    title,
                    systemImage: "hourglass",
                    description: Text("Cette section arrive au \(sprint).")
                )
                .foregroundStyle(AppColors.textSecondary)
            }
            .navigationTitle(title)
        }
    }
}
