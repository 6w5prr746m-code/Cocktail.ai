import SwiftData
import Foundation

/// Importe la bibliothèque de référence de cocktails (JSON embarqué dans
/// l'app) vers SwiftData au premier lancement.
///
/// Point d'architecture (voir doc Architecture Technique, §6) : en V1,
/// cette base de référence reste 100% locale, non synchronisée via
/// CloudKit — seules les données créées par l'utilisateur (Mon Bar,
/// recettes perso, favoris, historique) seront synchronisées à partir
/// du Sprint 5.
struct SeedImporter {

    enum SeedError: Error {
        case fileNotFound
    }

    /// N'importe le seed que si la base est vide, pour ne jamais dupliquer
    /// les données à chaque lancement de l'app.
    func importIfNeeded(into context: ModelContext) async {
        let descriptor = FetchDescriptor<CocktailEntity>()
        let existingCount = (try? context.fetchCount(descriptor)) ?? 0

        guard existingCount == 0 else { return }

        do {
            try await importSeed(into: context)
        } catch {
            print("⚠️ Échec de l'import du seed de cocktails : \(error)")
        }
    }

    private func importSeed(into context: ModelContext) async throws {
        guard let url = Bundle.main.url(forResource: "cocktails_seed", withExtension: "json") else {
            throw SeedError.fileNotFound
        }

        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        let dtos = try decoder.decode([CocktailSeedDTO].self, from: data)

        // Cache des ingrédients déjà créés durant cet import, pour ne pas
        // dupliquer un même ingrédient (ex: "Rhum blanc") entre plusieurs
        // cocktails du seed.
        var ingredientCache: [String: IngredientEntity] = [:]

        // Cache des cocktails par nom, réutilisé ensuite pour résoudre les
        // collections thématiques (voir importCollections ci-dessous).
        var cocktailsByName: [String: CocktailEntity] = [:]

        for dto in dtos {
            let cocktail = CocktailEntity(
                name: dto.name,
                category: dto.category,
                origin: dto.origin,
                history: dto.history,
                difficulty: dto.difficulty,
                mainSpirit: dto.mainSpirit,
                preparationTimeMinutes: dto.preparationTimeMinutes,
                glassware: dto.glassware,
                iceType: dto.iceType,
                garnish: dto.garnish,
                tips: dto.tips,
                imageURL: dto.imageURL
            )
            context.insert(cocktail)
            cocktailsByName[dto.name] = cocktail

            for ingredientDTO in dto.ingredients {
                let ingredient: IngredientEntity
                if let cached = ingredientCache[ingredientDTO.slug] {
                    ingredient = cached
                } else {
                    let newIngredient = IngredientEntity(
                        slug: ingredientDTO.slug,
                        name: ingredientDTO.name,
                        category: ingredientDTO.category,
                        colorHex: ingredientDTO.colorHex
                    )
                    context.insert(newIngredient)
                    ingredientCache[ingredientDTO.slug] = newIngredient
                    ingredient = newIngredient
                }

                let link = CocktailIngredientEntity(
                    ingredient: ingredient,
                    quantity: ingredientDTO.quantity,
                    unit: ingredientDTO.unit,
                    isOptional: ingredientDTO.isOptional,
                    role: ingredientDTO.role.flatMap(IngredientRole.init(rawValue:)) ?? .modifier
                )
                link.cocktail = cocktail
                context.insert(link)
            }

            for stepDTO in dto.steps {
                let step = RecipeStepEntity(
                    order: stepDTO.order,
                    instruction: stepDTO.instruction,
                    durationSeconds: stepDTO.durationSeconds
                )
                step.cocktail = cocktail
                context.insert(step)
            }
        }

        try await importCollections(into: context, cocktailsByName: cocktailsByName)
        try await importSubstitutions(into: context, ingredientsBySlug: ingredientCache)

        try context.save()
    }

    /// Importe les collections thématiques (Sprint 6). Les cocktails sont
    /// référencés par nom dans le JSON de seed — fragile à l'échelle de
    /// 1000 cocktails (voir PRD), mais suffisant pour la V1 : à terme, un
    /// vrai slug stable par cocktail (comme pour les ingrédients)
    /// remplacera ce lookup par nom.
    private func importCollections(
        into context: ModelContext,
        cocktailsByName: [String: CocktailEntity]
    ) async throws {
        guard let url = Bundle.main.url(forResource: "collections_seed", withExtension: "json") else {
            // Pas bloquant : l'app fonctionne sans collections, on log juste.
            print("⚠️ collections_seed.json introuvable — collections non importées.")
            return
        }

        let data = try Data(contentsOf: url)
        let dtos = try JSONDecoder().decode([CollectionSeedDTO].self, from: data)

        for dto in dtos {
            let matchedCocktails = dto.cocktailNames.compactMap { cocktailsByName[$0] }

            // Une collection sans aucun cocktail correspondant (nom introuvable
            // dans le seed actuel, ex: "Halloween" avant enrichissement de la
            // base) n'est pas importée pour éviter une collection vide inutile.
            guard !matchedCocktails.isEmpty else { continue }

            let collection = CollectionEntity(
                name: dto.name,
                iconName: dto.iconName,
                cocktails: matchedCocktails
            )
            context.insert(collection)
        }
    }

    /// Importe la table de substitutions (Sprint Matching Engine V2) —
    /// contenu de référence curé par l'équipe produit, jamais inféré
    /// automatiquement (voir `IngredientSubstitutionEntity`). Les
    /// ingrédients sont résolus par `slug` à partir du cache déjà
    /// construit pendant `importSeed`, pas re-fetchés en base.
    private func importSubstitutions(
        into context: ModelContext,
        ingredientsBySlug: [String: IngredientEntity]
    ) async throws {
        guard let url = Bundle.main.url(forResource: "substitutions_seed", withExtension: "json") else {
            print("⚠️ substitutions_seed.json introuvable — substitutions non importées.")
            return
        }

        let data = try Data(contentsOf: url)
        let dtos = try JSONDecoder().decode([SubstitutionSeedDTO].self, from: data)

        for dto in dtos {
            // Une substitution référençant un slug introuvable dans le
            // seed actuel n'est pas importée plutôt que de faire échouer
            // tout l'import — même philosophie défensive que les
            // collections vides ci-dessus.
            guard let source = ingredientsBySlug[dto.sourceSlug],
                  let substitute = ingredientsBySlug[dto.substituteSlug] else { continue }

            let substitution = IngredientSubstitutionEntity(
                sourceIngredientID: source.id,
                substituteIngredientID: substitute.id,
                degradationFactor: dto.degradationFactor
            )
            context.insert(substitution)
        }
    }
}
