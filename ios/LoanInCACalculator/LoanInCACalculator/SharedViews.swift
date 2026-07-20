import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

enum LoanInCATheme {
    static let brand = Color(red: 0.00, green: 0.43, blue: 0.48)
    static let action = Color(red: 0.02, green: 0.38, blue: 0.86)
    static let result = Color(red: 0.08, green: 0.55, blue: 0.34)
    static let warning = Color(red: 0.92, green: 0.48, blue: 0.08)
    static let refinance = Color(red: 0.49, green: 0.31, blue: 0.84)
    static let investment = Color(red: 0.82, green: 0.35, blue: 0.20)

    static var groupedBackground: Color {
#if canImport(UIKit)
        Color(uiColor: .systemGroupedBackground)
#else
        Color.gray.opacity(0.08)
#endif
    }

    static var surface: Color {
#if canImport(UIKit)
        Color(uiColor: .secondarySystemGroupedBackground)
#else
        Color.white
#endif
    }
}

struct LabeledNumberField: View {
    @Environment(\.appLanguage) private var language

    let title: String
    @Binding var value: Double
    var accent: Color = LoanInCATheme.action

    init(_ title: String, value: Binding<Double>, accent: Color = LoanInCATheme.action) {
        self.title = title
        self._value = value
        self.accent = accent
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.footnote.weight(.semibold))

            HStack(spacing: 10) {
                Image(systemName: "pencil.line")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(accent)

                TextField(title, value: $value, format: .number)
                    .font(.callout.monospacedDigit().weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .layoutPriority(1)
                    .keyboardType(.decimalPad)
                    .submitLabel(.next)
                    .accessibilityLabel(Text(title))

                Text(localized(language, zh: "输入", en: "Edit"))
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(accent)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(accent.opacity(0.12), in: Capsule())
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 12)
            .frame(minHeight: 48)
            .background(accent.opacity(0.07), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(accent.opacity(0.34), lineWidth: 1)
            }
        }
        .padding(.vertical, 3)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button(localized(language, zh: "完成", en: "Done")) {
                    dismissKeyboard()
                }
            }
        }
    }
}

struct ResultRow: View {
    let title: String
    let value: String
    var prominent = false

    init(_ title: String, value: String, prominent: Bool = false) {
        self.title = title
        self.value = value
        self.prominent = prominent
    }

    var body: some View {
        HStack(spacing: 12) {
            if prominent {
                Image(systemName: "chart.bar.fill")
                    .foregroundStyle(LoanInCATheme.result)
                    .accessibilityHidden(true)
            }
            Text(title)
                .foregroundStyle(prominent ? .primary : .secondary)
            Spacer(minLength: 12)
            Text(value)
                .font(.callout.monospacedDigit().weight(prominent ? .bold : .semibold))
                .foregroundStyle(prominent ? LoanInCATheme.result : .primary)
                .multilineTextAlignment(.trailing)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
                .allowsTightening(true)
                .layoutPriority(1)
        }
        .padding(.vertical, prominent ? 6 : 2)
        .accessibilityElement(children: .combine)
    }
}

struct CalculatorIntro: View {
    let title: String
    let subtitle: String
    var icon = "slider.horizontal.3"
    var accent: Color = LoanInCATheme.brand

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 46, height: 46)
                .background(accent, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.headline.bold())
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .combine)
    }
}

struct ResultHero: View {
    let label: String
    let value: String
    var detail: String? = nil
    var accent: Color = LoanInCATheme.result

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Label(label, systemImage: "sparkles")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(accent)
            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .allowsTightening(true)
                .layoutPriority(1)
            if let detail {
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 8)
        .dynamicTypeSize(.xSmall ... .accessibility2)
        .accessibilityElement(children: .combine)
    }
}

struct GuidanceNote: View {
    let text: String
    var kind: Kind = .information

    enum Kind {
        case information
        case caution

        var color: Color { self == .caution ? LoanInCATheme.warning : LoanInCATheme.action }
        var icon: String { self == .caution ? "exclamationmark.triangle.fill" : "info.circle.fill" }
    }

    var body: some View {
        Label {
            Text(text)
                .font(.footnote)
                .foregroundStyle(.secondary)
        } icon: {
            Image(systemName: kind.icon)
                .foregroundStyle(kind.color)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

struct PrimaryActionButton: View {
    let title: String
    var icon = "arrow.right"
    var tint: Color = LoanInCATheme.action
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(.headline)
                Spacer()
                Image(systemName: icon)
                    .font(.headline)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .frame(minHeight: 50)
            .background(tint, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(title))
    }
}

extension View {
    func calculatorFormStyle(accent: Color = LoanInCATheme.brand) -> some View {
        self
            .scrollContentBackground(.hidden)
            .background(LoanInCATheme.groupedBackground)
            .tint(accent)
            .scrollDismissesKeyboard(.interactively)
    }
}

private func dismissKeyboard() {
#if canImport(UIKit)
    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
#endif
}
