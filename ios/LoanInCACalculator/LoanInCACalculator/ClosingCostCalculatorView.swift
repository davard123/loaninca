import SwiftUI

struct ClosingCostCalculatorView: View {
    @Environment(\.appLanguage) private var language

    @State private var homePrice: Double = 750_000
    @State private var downPayment: Double = 150_000
    @State private var stateName = "California"
    @State private var countyName = "Los Angeles County"

    @State private var processing: Double = 1_295
    @State private var underwriting: Double = 1_095
    @State private var points: Double = 0

    @State private var appraisal: Double = 750
    @State private var creditReport: Double = 85
    @State private var titleInsurance: Double = 1_850
    @State private var settlement: Double = 1_250
    @State private var recording: Double = 175
    @State private var transferTax: Double = 900
    @State private var miscellaneous: Double = 250

    @State private var noteRate: Double = 6.25
    @State private var annualPropertyTax: Double = 8_400
    @State private var annualInsurance: Double = 1_650
    @State private var taxEscrowMonths: Double = 3
    @State private var insuranceEscrowMonths: Double = 12
    @State private var closingDate: Date = .now

    @State private var lenderCredit: Double = 0
    @State private var sellerCredit: Double = 0

    private var downPercent: Double {
        guard homePrice > 0 else { return 0 }
        return downPayment / homePrice * 100
    }

    private var summary: ClosingCostSummary {
        CalculatorEngine.closingCostSummary(
            homePrice: homePrice,
            downPayment: downPayment,
            processing: processing,
            underwriting: underwriting,
            points: points,
            appraisal: appraisal,
            creditReport: creditReport,
            titleInsurance: titleInsurance,
            settlement: settlement,
            recording: recording,
            transferTax: transferTax,
            miscellaneous: miscellaneous,
            noteRate: noteRate,
            annualPropertyTax: annualPropertyTax,
            annualInsurance: annualInsurance,
            taxEscrowMonths: taxEscrowMonths,
            insuranceEscrowMonths: insuranceEscrowMonths,
            closingDate: closingDate,
            lenderCredit: lenderCredit,
            sellerCredit: sellerCredit
        )
    }

    private var cashToClose: Double {
        max(downPayment, 0) + summary.totalClosingCosts
    }

    var body: some View {
        Form {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "Closing 要准备多少钱？", en: "How much cash for closing?"),
                    subtitle: localized(language, zh: "填写房价、首付和费用，绿色数字会显示预计交割现金。", en: "Enter price, down payment, and fees. The green total shows estimated cash to close."),
                    icon: "checklist.checked",
                    accent: LoanInCATheme.warning
                )
            }

            Section(localized(language, zh: "预计交割现金", en: "Estimated Cash to Close")) {
                ResultHero(
                    label: localized(language, zh: "预计交割现金", en: "Estimated cash to close"),
                    value: LoanFormatter.currencyString(cashToClose),
                    detail: localized(language, zh: "首付加费用与预付项，再减去抵扣", en: "Down payment plus costs and prepaids, less credits")
                )
                ResultRow(localized(language, zh: "首付", en: "Down Payment"), value: LoanFormatter.currencyString(downPayment))
                ResultRow(localized(language, zh: "Closing Cost", en: "Closing Cost"), value: LoanFormatter.currencyString(summary.totalClosingCosts))
                ResultRow(localized(language, zh: "Credits", en: "Credits"), value: LoanFormatter.currencyString(summary.totalCredits))
            }

            Section(localized(language, zh: "房屋信息", en: "Property")) {
                Picker(localized(language, zh: "州", en: "State"), selection: $stateName) {
                    Text("California").tag("California")
                }
                Picker(localized(language, zh: "县", en: "County"), selection: $countyName) {
                    Text("Los Angeles County").tag("Los Angeles County")
                    Text("Orange County").tag("Orange County")
                    Text("San Diego County").tag("San Diego County")
                    Text("Santa Clara County").tag("Santa Clara County")
                }
                LabeledNumberField(localized(language, zh: "房价", en: "Home Price"), value: $homePrice)
                LabeledNumberField(localized(language, zh: "首付", en: "Down Payment"), value: $downPayment)
                ResultRow(localized(language, zh: "首付占比", en: "Down Payment %"), value: LoanFormatter.percentString(downPercent))
                ResultRow(localized(language, zh: "贷款金额", en: "Loan Amount"), value: LoanFormatter.currencyString(summary.loanAmount))
            }

            Section(localized(language, zh: "一次性贷款费用", en: "One-Time Lender Fees")) {
                LabeledNumberField("Processing", value: $processing)
                LabeledNumberField("Underwriting", value: $underwriting)
                LabeledNumberField("Points", value: $points)
                Text(localized(language, zh: "Processing、Underwriting、Points 有时可通过 Lender Credit 或利率选择调整。", en: "Processing, underwriting, and points may be adjusted through lender credits or rate choices."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "第三方与产权费用", en: "Third Party and Title")) {
                LabeledNumberField("Appraisal", value: $appraisal)
                LabeledNumberField(localized(language, zh: "信用报告费", en: "Credit Report"), value: $creditReport)
                LabeledNumberField("Title Insurance", value: $titleInsurance)
                LabeledNumberField("Settlement", value: $settlement)
                LabeledNumberField("Recording", value: $recording)
                LabeledNumberField("Transfer Tax", value: $transferTax)
                LabeledNumberField("Misc", value: $miscellaneous)
                Text(localized(language, zh: "部分产权、Escrow、结算服务和卖方 Credit 可协商，实际以 Closing Disclosure 为准。", en: "Some title, escrow, settlement services, and seller credits may be negotiable. Actual numbers come from the Closing Disclosure."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "Prepaid / Escrow Reserve", en: "Prepaids / Escrow Reserve")) {
                DatePicker(localized(language, zh: "Closing 日期", en: "Closing Date"), selection: $closingDate, displayedComponents: .date)
                LabeledNumberField(localized(language, zh: "Note Rate (%)", en: "Note Rate (%)"), value: $noteRate)
                LabeledNumberField(localized(language, zh: "Property Tax / 年", en: "Property Tax / Year"), value: $annualPropertyTax)
                LabeledNumberField(localized(language, zh: "Insurance / 年", en: "Insurance / Year"), value: $annualInsurance)
                LabeledNumberField(localized(language, zh: "Tax Escrow 月数", en: "Tax Escrow Months"), value: $taxEscrowMonths)
                LabeledNumberField(localized(language, zh: "Insurance Escrow 月数", en: "Insurance Escrow Months"), value: $insuranceEscrowMonths)
            }

            Section(localized(language, zh: "Credits", en: "Credits")) {
                LabeledNumberField("Lender Credit", value: $lenderCredit)
                LabeledNumberField("Seller Credit", value: $sellerCredit)
            }

            Section(localized(language, zh: "明细结果", en: "Breakdown")) {
                ResultRow(localized(language, zh: "Lender Fees", en: "Lender Fees"), value: LoanFormatter.currencyString(summary.lenderFees))
                ResultRow(localized(language, zh: "Third Party Fees", en: "Third Party Fees"), value: LoanFormatter.currencyString(summary.thirdPartyFees))
                ResultRow(localized(language, zh: "Prepaid Days", en: "Prepaid Days"), value: "\(summary.prepaidDays)")
                ResultRow(localized(language, zh: "Prepaid Interest", en: "Prepaid Interest"), value: LoanFormatter.currencyString(summary.prepaidInterest))
                ResultRow(localized(language, zh: "Tax Escrow", en: "Tax Escrow"), value: LoanFormatter.currencyString(summary.taxEscrowAmount))
                ResultRow(localized(language, zh: "Insurance Escrow", en: "Insurance Escrow"), value: LoanFormatter.currencyString(summary.insuranceEscrowAmount))
                ResultRow(localized(language, zh: "Closing Cost", en: "Closing Cost"), value: LoanFormatter.currencyString(summary.totalClosingCosts), prominent: true)
            }

            Section(localized(language, zh: "估算依据", en: "Estimate Basis")) {
                Text(localized(language, zh: "默认值以加州常见购房费用结构做预算起点，不是税务、法律或贷款建议。不同县市、产权公司、贷款机构和交易合同会显著影响实际交割现金。", en: "Defaults are a California budgeting starting point, not tax, legal, or lending advice. County, title company, lender, and contract terms can materially change actual cash to close."))
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.warning)
        .navigationTitle(localized(language, zh: "Closing 费用", en: "Closing Costs"))
    }
}

#Preview {
    NavigationStack {
        ClosingCostCalculatorView()
            .environment(\.appLanguage, .zhHans)
    }
}
