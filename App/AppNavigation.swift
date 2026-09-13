import SwiftUI
import Observation

/// Navigation centralisée par onglet, pilotée par état plutôt que par des
/// NavigationLink codés en dur dans les Views profondes (voir Architecture
/// Technique, §5). Les écrans des sprints suivants pousseront leurs
/// destinations ici plutôt que de gérer leur propre NavigationPath.
@MainActor
@Observable
final class AppNavigation {

    var homePath = NavigationPath()
    var libraryPath = NavigationPath()
    var myBarPath = NavigationPath()
    var favoritesPath = NavigationPath()
    var profilePath = NavigationPath()

    enum Destination: Hashable {
        case cocktailDetail(id: UUID)
        case preparationMode(id: UUID)
        case collection(id: UUID)
        case createRecipe
        case editRecipe(id: UUID)
    }

    enum Tab: Hashable {
        case home, library, myBar, favorites, profile
    }

    var selectedTab: Tab = .home

    func push(_ destination: Destination, on tab: Tab) {
        switch tab {
        case .home: homePath.append(destination)
        case .library: libraryPath.append(destination)
        case .myBar: myBarPath.append(destination)
        case .favorites: favoritesPath.append(destination)
        case .profile: profilePath.append(destination)
        }
    }
}
