import SwiftUI

struct LabeledNumberField: View {
    let title: String
    @Binding var value: Double

    init(_ title: String, value: Binding<Double>) {
        self.title = title
        self._value = value
    }

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            TextField(title, value: $value, format: .number)
                .multilineTextAlignment(.trailing)
                .keyboardType(.decimalPad)
                .frame(maxWidth: 180)
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
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .fontWeight(prominent ? .semibold : .regular)
                .foregroundStyle(prominent ? Color("AccentColor") : .primary)
        }
    }
}
