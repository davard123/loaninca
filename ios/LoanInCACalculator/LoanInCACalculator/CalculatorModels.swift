import Foundation

enum PurchaseLoanType: String, CaseIterable, Identifiable {
    case conventional
    case nonQM
    case dscr
    case bankStatement
    case fha
    case va

    var id: String { rawValue }

    var title: String {
        switch self {
        case .conventional: return "Conventional"
        case .nonQM: return "Non-QM"
        case .dscr: return "DSCR"
        case .bankStatement: return "Bank Statement"
        case .fha: return "FHA"
        case .va: return "VA"
        }
    }
}

enum RefinanceMode: String, CaseIterable, Identifiable {
    case rateTerm
    case cashOut

    var id: String { rawValue }

    var title: String {
        switch self {
        case .rateTerm: return "Rate / Term"
        case .cashOut: return "Cash-Out"
        }
    }
}

enum PayPeriod: String, CaseIterable, Identifiable {
    case monthly
    case biweekly
    case weekly
    case annually

    var id: String { rawValue }

    var title: String {
        switch self {
        case .monthly: return "月薪"
        case .biweekly: return "双周"
        case .weekly: return "周薪"
        case .annually: return "年薪"
        }
    }
}

enum JobIncomeType: String, CaseIterable, Identifiable {
    case w2
    case hourly

    var id: String { rawValue }

    var title: String {
        switch self {
        case .w2: return "W-2"
        case .hourly: return "时薪"
        }
    }
}

enum SelfEmploymentMethod: String, CaseIterable, Identifiable {
    case du
    case lp

    var id: String { rawValue }

    var title: String {
        switch self {
        case .du: return "DU"
        case .lp: return "LP"
        }
    }
}

struct PurchaseResult {
    let loanAmount: Double
    let ltv: Double
    let principalInterest: Double
    let propertyTaxMonthly: Double
    let insuranceMonthly: Double
    let pmiMonthly: Double
    let totalMonthly: Double
    let totalMonthlyDebt: Double
    let requiredIncome36: Double
    let requiredIncome43: Double
    let requiredIncome50: Double
    let dscr: Double?
}

struct RefinanceResult {
    let newLoan: Double
    let newLtv: Double
    let currentPayment: Double
    let newPayment: Double
    let monthlySavings: Double
    let breakEvenMonths: Int
    let cashOut: Double
}

struct IncomeSummary {
    let primaryJobMonthly: Double
    let secondaryJobMonthly: Double
    let selfEmploymentMonthly: Double
    let rentalMonthly: Double
    let childSupportMonthly: Double
    let socialSecurityMonthly: Double
    let otherMonthly: Double
    let totalMonthly: Double
}

struct ClosingCostSummary {
    let loanAmount: Double
    let lenderFees: Double
    let thirdPartyFees: Double
    let prepaidDays: Int
    let prepaidInterest: Double
    let taxEscrowAmount: Double
    let insuranceEscrowAmount: Double
    let prepaidSubtotal: Double
    let totalCredits: Double
    let totalClosingCosts: Double
}

struct AmortizationComparison {
    let equalPaymentMonthly: Double
    let equalPaymentTotalInterest: Double
    let equalPrincipalFirstMonth: Double
    let equalPrincipalLastMonth: Double
    let equalPrincipalTotalInterest: Double
}

struct PurchaseTaxSummary {
    let annualPropertyTax: Double
    let transferTax: Double
    let recordingFee: Double
    let estimatedTotalTaxFees: Double
}

struct InvestmentComparisonSummary {
    let futureValueAtExpectedReturn: Double
    let futureValueAtMortgageRate: Double
    let expectedGain: Double
    let mortgageRateBenchmarkGain: Double
    let spread: Double
}

struct PolicyNewsFeed: Codable {
    let generatedAt: String
    let notes: String
    let items: [PolicyNewsItem]

    enum CodingKeys: String, CodingKey {
        case generatedAt = "generated_at"
        case notes
        case items
    }
}

struct PolicyNewsItem: Codable, Identifiable {
    let source: String
    let date: String
    let title: String
    let summary: String
    let url: String

    var id: String { "\(source)-\(date)-\(title)" }
}
