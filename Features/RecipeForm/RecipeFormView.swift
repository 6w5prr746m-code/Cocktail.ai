import SwiftUI
import SwiftData

/// Formulaire de création (US-D1) et modification (US-D2) de recette
/// personnelle — même Vue pour les deux cas, pilotée par `RecipeFormViewModel`.
struct RecipeFormView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: RecipeFormViewModel
    @State private var savedCocktailID: UUID?

    init(modelContext: ModelContext, existingCocktailID: UUID? = nil) {
        _viewModel = State(
            initialValue: RecipeFormViewModel(modelContext: modelContext, existingCocktailID: existingCocktailID)
        )
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Informations") {
                    TextField("Nom du cocktail", text: $viewModel.name)
                    TextField("Catégorie (ex: Tiki, Sans alcool…)", text: $viewModel.category)
                    TextField("Alcool principal", text: $viewModel.mainSpirit)

                    Picker("Difficulté", selection: $viewModel.difficulty) {
                        Text("Facile").tag(1)
                        Text("Intermédiaire").tag(2)
                        Text("Difficile").tag(3)
                    }

                    Stepper(
                        "Temps de préparation : \(viewModel.preparationTimeMinutes) min",
                        value: $viewModel.preparationTimeMinutes,
                        in: 1...30
                    )
                }
                .listRowBackground(AppColors.surface)

                Section("Service") {
                    TextField("Verrerie", text: $viewModel.glassware)
                    TextField("Type de glace", text: $viewModel.iceType)
                    TextField("Décoration", text: $viewModel.garnish)
                }
                .listRowBackground(AppColors.surface)

                Section("Ingrédients") {
                    ForEach(Array(viewModel.ingredientRows.enumerated()), id: \.element.id) { index, _ in
                        HStack {
                            TextField("Nom", text: $viewModel.ingredientRows[index].name)
                            TextField("Qté", text: $viewModel.ingredientRows[index].quantity)
                                .frame(width: 50)
                                .keyboardType(.decimalPad)
                            TextField("Unité", text: $viewModel.ingredientRows[index].unit)
                                .frame(width: 60)
                        }
                    }
                    .onDelete { offsets in
                        offsets.forEach { viewModel.removeIngredientRow(at: $0) }
                    }

                    Button {
                        viewModel.addIngredientRow()
                    } label: {
                        Label("Ajouter un ingrédient", systemImage: "plus.circle")
                    }
                }
                .listRowBackground(AppColors.surface)

                Section("Préparation") {
                    ForEach(Array(viewModel.stepRows.enumerated()), id: \.element.id) { index, _ in
                        HStack(alignment: .top) {
                            Text("\(index + 1).")
                                .foregroundStyle(AppColors.accentGold)
                            TextField("Étape \(index + 1)", text: $viewModel.stepRows[index].instruction, axis: .vertical)
                        }
                    }
                    .onDelete { offsets in
                        offsets.forEach { viewModel.removeStepRow(at: $0) }
                    }

                    Button {
                        viewModel.addStepRow()
                    } label: {
                        Label("Ajouter une étape", systemImage: "plus.circle")
                    }
                }
                .listRowBackground(AppColors.surface)

                Section("Conseils (optionnel)") {
                    TextField("Un conseil de préparation…", text: $viewModel.tips, axis: .vertical)
                }
                .listRowBackground(AppColors.surface)
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .navigationTitle(viewModel.isEditMode ? "Modifier la recette" : "Créer une recette")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(viewModel.isEditMode ? "Enregistrer" : "Ajouter à ma bibliothèque") {
                        savedCocktailID = viewModel.save()
                        dismiss()
                    }
                    .disabled(!viewModel.canSave)
                    .fontWeight(.semibold)
                }
            }
            .onAppear { viewModel.loadIfEditing() }
        }
    }
}
