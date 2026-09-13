import SwiftUI
import SwiftData
import Observation

/// ViewModel partagé par la création (US-D1) et la modification (US-D2)
/// de recettes personnelles. Le même formulaire sert aux deux cas : en
/// mode édition, `existingCocktailID` est renseigné et les champs sont
/// pré-remplis depuis le cocktail existant.
///
/// Limitation V1 assumée (voir README) : les recettes créées ici sont des
/// `CocktailEntity` classiques (`isUserCreated = true`), stockées dans la
/// configuration "Reference" — donc **locales, non synchronisées via
/// CloudKit** pour l'instant. Les faire vivre dans le groupe "User" sync
/// aurait nécessité soit de dupliquer tout le modèle `CocktailEntity`
/// dans une entité séparée `UserRecipeEntity`, soit d'assouplir la
/// séparation stricte référence/perso posée à l'Architecture Technique
/// (§6) et au Sprint 5 — un vrai choix de conception à trancher avant la
/// V2, pas une simplification à faire à la légère ici.
@MainActor
@Observable
final class RecipeFormViewModel {

    private let modelContext: ModelContext
    let existingCocktailID: UUID?

    var name: String = ""
    var category: String = "Personnalisé"
    var mainSpirit: String = ""
    var difficulty: Int = 1
    var preparationTimeMinutes: Int = 3
    var glassware: String = ""
    var iceType: String = ""
    var garnish: String = ""
    var tips: String = ""

    struct IngredientRow: Identifiable {
        let id = UUID()
        var name: String = ""
        var quantity: String = ""
        var unit: String = "cl"
    }

    struct StepRow: Identifiable {
        let id = UUID()
        var instruction: String = ""
    }

    var ingredientRows: [IngredientRow] = [IngredientRow()]
    var stepRows: [StepRow] = [StepRow()]

    var isEditMode: Bool { existingCocktailID != nil }

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        ingredientRows.contains { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty } &&
        stepRows.contains { !$0.instruction.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    init(modelContext: ModelContext, existingCocktailID: UUID? = nil) {
        self.modelContext = modelContext
        self.existingCocktailID = existingCocktailID
    }

    func loadIfEditing() {
        guard let existingCocktailID else { return }

        let descriptor = FetchDescriptor<CocktailEntity>(
            predicate: #Predicate { $0.id == existingCocktailID }
        )
        guard let cocktail = try? modelContext.fetch(descriptor).first else { return }

        name = cocktail.name
        category = cocktail.category
        mainSpirit = cocktail.mainSpirit
        difficulty = cocktail.difficulty
        preparationTimeMinutes = cocktail.preparationTimeMinutes
        glassware = cocktail.glassware
        iceType = cocktail.iceType
        garnish = cocktail.garnish
        tips = cocktail.tips ?? ""

        ingredientRows = cocktail.ingredients
            .sorted { $0.ingredient.name < $1.ingredient.name }
            .map { link in
                IngredientRow(name: link.ingredient.name, quantity: formattedQuantity(link.quantity), unit: link.unit)
            }
        if ingredientRows.isEmpty { ingredientRows = [IngredientRow()] }

        stepRows = cocktail.steps
            .sorted { $0.order < $1.order }
            .map { StepRow(instruction: $0.instruction) }
        if stepRows.isEmpty { stepRows = [StepRow()] }
    }

    func addIngredientRow() { ingredientRows.append(IngredientRow()) }
    func removeIngredientRow(at index: Int) {
        guard ingredientRows.count > 1 else { return }
        ingredientRows.remove(at: index)
    }

    func addStepRow() { stepRows.append(StepRow()) }
    func removeStepRow(at index: Int) {
        guard stepRows.count > 1 else { return }
        stepRows.remove(at: index)
    }

    /// Sauvegarde la recette (création ou mise à jour) et renvoie l'id du
    /// cocktail sauvegardé, pour permettre à la Vue de naviguer vers sa fiche.
    @discardableResult
    func save() -> UUID? {
        guard canSave else { return nil }

        let cocktail: CocktailEntity
        if let existingCocktailID,
           let existing = try? modelContext.fetch(
               FetchDescriptor<CocktailEntity>(predicate: #Predicate { $0.id == existingCocktailID })
           ).first {
            cocktail = existing
            // On repart des ingrédients/étapes existants pour les remplacer
            // proprement (suppression en cascade déjà configurée sur le modèle).
            for link in cocktail.ingredients { modelContext.delete(link) }
            for step in cocktail.steps { modelContext.delete(step) }
            cocktail.ingredients = []
            cocktail.steps = []
        } else {
            cocktail = CocktailEntity(
                name: name,
                category: category,
                difficulty: difficulty,
                mainSpirit: mainSpirit,
                preparationTimeMinutes: preparationTimeMinutes,
                glassware: glassware,
                iceType: iceType,
                garnish: garnish,
                imageURL: "user_recipe_placeholder",
                isUserCreated: true
            )
            modelContext.insert(cocktail)
        }

        cocktail.name = name
        cocktail.category = category
        cocktail.mainSpirit = mainSpirit
        cocktail.difficulty = difficulty
        cocktail.preparationTimeMinutes = preparationTimeMinutes
        cocktail.glassware = glassware
        cocktail.iceType = iceType
        cocktail.garnish = garnish
        cocktail.tips = tips.isEmpty ? nil : tips

        // Correctif Sprint 10 : une seule requête pour tous les ingrédients
        // existants, réutilisée pour chaque ligne du formulaire — la version
        // précédente refaisait un FetchDescriptor<IngredientEntity>() complet
        // à chaque ligne (coût O(n×m) inutile, repéré en revue de code).
        let existingIngredients = (try? modelContext.fetch(FetchDescriptor<IngredientEntity>())) ?? []
        var ingredientCache = Dictionary(
            existingIngredients.map { ($0.name.lowercased(), $0) },
            uniquingKeysWith: { first, _ in first }
        )

        for row in ingredientRows where !row.name.trimmingCharacters(in: .whitespaces).isEmpty {
            let ingredient = findOrCreateIngredient(named: row.name, cache: &ingredientCache)
            let link = CocktailIngredientEntity(
                ingredient: ingredient,
                quantity: Double(row.quantity.replacingOccurrences(of: ",", with: ".")) ?? 1,
                unit: row.unit.isEmpty ? "unité" : row.unit
            )
            link.cocktail = cocktail
            modelContext.insert(link)
        }

        for (index, row) in stepRows.enumerated() where !row.instruction.trimmingCharacters(in: .whitespaces).isEmpty {
            let step = RecipeStepEntity(order: index + 1, instruction: row.instruction)
            step.cocktail = cocktail
            modelContext.insert(step)
        }

        try? modelContext.save()
        return cocktail.id
    }

    /// Réutilise un ingrédient existant du référentiel (recherche insensible
    /// à la casse, via le cache construit une seule fois dans `save()`) ou
    /// en crée un nouveau à la volée — voir US-D1, l'utilisateur ne doit
    /// pas être bloqué par une liste fermée d'ingrédients.
    private func findOrCreateIngredient(
        named name: String,
        cache: inout [String: IngredientEntity]
    ) -> IngredientEntity {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let key = trimmedName.lowercased()

        if let existing = cache[key] {
            return existing
        }

        let slug = key
            .folding(options: .diacriticInsensitive, locale: .current)
            .replacingOccurrences(of: " ", with: "_")

        let newIngredient = IngredientEntity(slug: slug, name: trimmedName, category: "Autre")
        modelContext.insert(newIngredient)
        cache[key] = newIngredient
        return newIngredient
    }

    private func formattedQuantity(_ value: Double) -> String {
        CocktailFormatting.quantityLabel(value)
    }
}
