import SwiftUI
import SwiftData

/// Détail d'une collection thématique (US-B3) : grille des cocktails
/// qu'elle contient.
struct CollectionDetailView: View {

    let collectionID: UUID
    let modelContext: ModelContext
    @State private var collection: CollectionEntity?

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            if let collection {
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 14)], spacing: 14) {
                        ForEach(collection.cocktails) { cocktail in
                            NavigationLink(value: AppNavigation.Destination.cocktailDetail(id: cocktail.id)) {
                                CocktailCard(cocktail: cocktail, width: 150)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            } else {
                ProgressView().tint(AppColors.accentGold)
            }
        }
        .navigationTitle(collection?.name ?? "Collection")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: load)
    }

    private func load() {
        let descriptor = FetchDescriptor<CollectionEntity>(
            predicate: #Predicate { $0.id == collectionID }
        )
        collection = try? modelContext.fetch(descriptor).first
    }
}
