import WidgetKit
import SwiftUI

struct CocktailWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: CocktailWidgetEntry

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            AppColors.gradient(for: entry.cocktailCategory)

            VStack(alignment: .leading, spacing: 4) {
                Text("SUGGESTION DU JOUR")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(1)
                    .foregroundStyle(.white.opacity(0.75))

                Text(entry.cocktailName)
                    .font(.system(size: family == .systemSmall ? 18 : 24, weight: .bold, design: .serif))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                if family != .systemSmall {
                    Text(entry.cocktailCategory)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.75))
                }
            }
            .padding()
        }
        .widgetURL(entry.cocktailID.map { QRCodeGenerator.deepLinkURL(forCocktailID: $0) })
    }
}

struct CocktailWidget: Widget {
    let kind = "CocktailWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CocktailWidgetProvider()) { entry in
            CocktailWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) { Color.clear }
        }
        .configurationDisplayName("Suggestion du jour")
        .description("Une idée de cocktail différente chaque jour, à préparer avec ce que tu as sous la main.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct CocktailWidgetBundle: WidgetBundle {
    var body: some Widget {
        CocktailWidget()
    }
}
