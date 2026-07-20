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

    func title(for language: AppLanguage) -> String {
        switch self {
        case .conventional: return localized(language, zh: "常规贷款", en: "Conventional")
        case .nonQM: return localized(language, zh: "非 QM", en: "Non-QM")
        case .dscr: return "DSCR"
        case .bankStatement: return localized(language, zh: "银行流水", en: "Bank Statement")
        case .fha: return "FHA"
        case .va: return "VA"
        }
    }
}

enum MortgageRateStructure: String, CaseIterable, Identifiable {
    case fixed
    case arm

    var id: String { rawValue }

    func title(for language: AppLanguage) -> String {
        switch self {
        case .fixed: return localized(language, zh: "固定利率", en: "Fixed")
        case .arm: return localized(language, zh: "浮动利率 ARM", en: "Adjustable ARM")
        }
    }
}

enum ARMProgram: String, CaseIterable, Identifiable {
    case fiveSix = "5/6"
    case sevenSix = "7/6"
    case tenSix = "10/6"

    var id: String { rawValue }

    func explanation(for language: AppLanguage) -> String {
        switch self {
        case .fiveSix:
            return localized(language, zh: "前 5 年固定，之后通常每 6 个月调整一次。", en: "Fixed for 5 years, then typically adjusts every 6 months.")
        case .sevenSix:
            return localized(language, zh: "前 7 年固定，之后通常每 6 个月调整一次。", en: "Fixed for 7 years, then typically adjusts every 6 months.")
        case .tenSix:
            return localized(language, zh: "前 10 年固定，之后通常每 6 个月调整一次。", en: "Fixed for 10 years, then typically adjusts every 6 months.")
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

    func title(for language: AppLanguage) -> String {
        switch self {
        case .rateTerm: return localized(language, zh: "降息/改期限", en: "Rate / Term")
        case .cashOut: return localized(language, zh: "套现重贷", en: "Cash-Out")
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

    func title(for language: AppLanguage) -> String {
        switch self {
        case .monthly: return localized(language, zh: "月薪", en: "Monthly")
        case .biweekly: return localized(language, zh: "双周", en: "Biweekly")
        case .weekly: return localized(language, zh: "周薪", en: "Weekly")
        case .annually: return localized(language, zh: "年薪", en: "Annual")
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

    func title(for language: AppLanguage) -> String {
        switch self {
        case .w2: return "W-2"
        case .hourly: return localized(language, zh: "时薪", en: "Hourly")
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

    func title(for language: AppLanguage) -> String {
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
    let closingCostsFinanced: Double
    let fiveYearPaymentChange: Double
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
    let titleZh: String?
    let summaryZh: String?
    let url: String

    var id: String { "\(source)-\(date)-\(title)" }

    enum CodingKeys: String, CodingKey {
        case source, date, title, summary, url
        case titleZh = "title_zh"
        case summaryZh = "summary_zh"
    }

    func localizedTitle(for language: AppLanguage) -> String {
        language == .zhHans ? (titleZh ?? title) : title
    }

    func localizedSummary(for language: AppLanguage) -> String {
        language == .zhHans ? (summaryZh ?? summary) : summary
    }
}
