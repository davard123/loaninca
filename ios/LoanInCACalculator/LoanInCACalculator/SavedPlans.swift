import SwiftUI

struct SavedPlan: Codable, Identifiable, Equatable {
    enum Kind: String, Codable {
        case purchase
        case refinance
        case closing
        case income
        case investment
    }

    let id: UUID
    var name: String
    var kind: Kind
    var createdAt: Date
    var headline: String
    var monthlyPayment: Double?
    var loanAmount: Double?
    var cashToClose: Double?
    var notes: [String]

    var shareText: String {
        var lines = ["LoanInCA.com - \(name)", headline]
        if let monthlyPayment {
            lines.append("Estimated monthly payment: \(LoanFormatter.currencyString(monthlyPayment))")
        }
        if let loanAmount {
            lines.append("Loan amount: \(LoanFormatter.currencyString(loanAmount))")
        }
        if let cashToClose {
            lines.append("Estimated cash to close: \(LoanFormatter.currencyString(cashToClose))")
        }
        lines.append(contentsOf: notes)
        lines.append("For planning only. Not a loan quote or approval.")
        return lines.joined(separator: "\n")
    }
}

final class SavedPlansStore: ObservableObject {
    @Published private(set) var plans: [SavedPlan] = []

    private let defaultsKey = "savedPlans.v1"

    init() {
        load()
    }

    func add(_ plan: SavedPlan) {
        plans.insert(plan, at: 0)
        save()
    }

    func delete(at offsets: IndexSet) {
        plans.remove(atOffsets: offsets)
        save()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let decoded = try? JSONDecoder().decode([SavedPlan].self, from: data)
        else {
            plans = []
            return
        }
        plans = decoded.sorted { $0.createdAt > $1.createdAt }
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(plans) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }
}
