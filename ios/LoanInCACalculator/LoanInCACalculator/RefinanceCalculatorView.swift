import SwiftUI

struct RefinanceCalculatorView: View {
    @Environment(\.appLanguage) private var language

    @State private var mode: RefinanceMode = .rateTerm
    @State private var homeValue: Double = 500_000
    @State private var balance: Double = 320_000
    @State private var currentRate: Double = 7.0
    @State private var currentRemainingTerm: Double = 25
    @State private var newRate: Double = 6.0
    @State private var newTerm: Double = 30
    @State private var closingCosts: Double = 6_000
    @State private var financeClosingCosts = false
    @State private var desiredCashOut: Double = 50_000
    @State private var expectedHoldYears: Double = 5

    private var result: RefinanceResult {
        CalculatorEngine.refinanceSummary(
            homeValue: homeValue,
            balance: balance,
            currentRate: currentRate,
            currentRemainingTerm: Int(currentRemainingTerm),
            newRate: newRate,
            newTerm: Int(newTerm),
            closingCosts: closingCosts,
            financeClosingCosts: financeClosingCosts,
            mode: mode,
            desiredCashOut: desiredCashOut
        )
    }

    private var holdMonths: Int {
        max(Int(expectedHoldYears * 12), 0)
    }

    private var holdPeriodSavings: Double {
        result.monthlySavings * Double(holdMonths) - (financeClosingCosts ? 0 : max(closingCosts, 0))
    }

    var body: some View {
        Form {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "重贷是否划算？", en: "Is refinancing worth it?"),
                    subtitle: localized(language, zh: "填写当前贷款和新方案，结果会比较月供与回本时间。", en: "Enter the current loan and new option to compare payment and break-even."),
                    icon: "arrow.triangle.2.circlepath",
                    accent: LoanInCATheme.refinance
                )
            }

            Section(localized(language, zh: "重贷类型", en: "Refinance Type")) {
                Picker(localized(language, zh: "重贷类型", en: "Refinance Type"), selection: $mode) {
                    ForEach(RefinanceMode.allCases) { item in
                        Text(item.title(for: language)).tag(item)
                    }
                }
                .pickerStyle(.segmented)
            }

            Section(localized(language, zh: "当前贷款", en: "Current Loan")) {
                LabeledNumberField(localized(language, zh: "房屋价值", en: "Home Value"), value: $homeValue)
                LabeledNumberField(localized(language, zh: "现有余额", en: "Current Balance"), value: $balance)
                LabeledNumberField(localized(language, zh: "当前利率 (%)", en: "Current Rate (%)"), value: $currentRate)
                LabeledNumberField(localized(language, zh: "剩余期限 (年)", en: "Remaining Term (Years)"), value: $currentRemainingTerm)
            }

            Section(localized(language, zh: "新贷款", en: "New Loan")) {
                LabeledNumberField(localized(language, zh: "新利率 (%)", en: "New Rate (%)"), value: $newRate)
                LabeledNumberField(localized(language, zh: "新期限 (年)", en: "New Term (Years)"), value: $newTerm)
                LabeledNumberField(localized(language, zh: "Closing Cost", en: "Closing Cost"), value: $closingCosts)
                Toggle(localized(language, zh: "将 Closing Cost 计入新贷款", en: "Finance closing costs into new loan"), isOn: $financeClosingCosts)

                if mode == .cashOut {
                    LabeledNumberField(localized(language, zh: "计划套现", en: "Desired Cash Out"), value: $desiredCashOut)
                }
            }

            Section(localized(language, zh: "持有周期", en: "Holding Period")) {
                LabeledNumberField(localized(language, zh: "预计继续持有 (年)", en: "Expected Hold (Years)"), value: $expectedHoldYears)
            }

            Section(localized(language, zh: "结果", en: "Results")) {
                ResultHero(
                    label: localized(language, zh: "预计每月变化", en: "Estimated monthly change"),
                    value: LoanFormatter.currencyString(result.monthlySavings),
                    detail: result.monthlySavings >= 0 ? localized(language, zh: "正数表示每月可能节省", en: "A positive value indicates potential monthly savings") : localized(language, zh: "负数表示新月供可能更高", en: "A negative value indicates a higher new payment"),
                    accent: result.monthlySavings >= 0 ? LoanInCATheme.result : LoanInCATheme.warning
                )
                ResultRow(localized(language, zh: "当前月供", en: "Current Payment"), value: LoanFormatter.currencyString(result.currentPayment))
                ResultRow(localized(language, zh: "新月供", en: "New Payment"), value: LoanFormatter.currencyString(result.newPayment))
                ResultRow(localized(language, zh: "每月变化", en: "Monthly Change"), value: LoanFormatter.currencyString(result.monthlySavings), prominent: result.monthlySavings > 0)
                ResultRow(localized(language, zh: "新贷款额", en: "New Loan Amount"), value: LoanFormatter.currencyString(result.newLoan))
                ResultRow(localized(language, zh: "新 LTV", en: "New LTV"), value: LoanFormatter.percentString(result.newLtv))
                ResultRow(localized(language, zh: "5 年月供差", en: "5-Year Payment Difference"), value: LoanFormatter.currencyString(result.fiveYearPaymentChange))

                if mode == .cashOut {
                    ResultRow(localized(language, zh: "可拿现金", en: "Cash Out"), value: LoanFormatter.currencyString(result.cashOut), prominent: true)
                }

                ResultRow(localized(language, zh: "回本时间", en: "Break Even"), value: result.breakEvenMonths == 0 ? "N/A" : localized(language, zh: "\(result.breakEvenMonths) 个月", en: "\(result.breakEvenMonths) months"))
            }

            Section(localized(language, zh: "解读", en: "Interpretation")) {
                Text(interpretation)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text(localized(language, zh: "重贷结果是简化估算，不代表贷款机构报价、利率锁定或审批。请结合总利息、税务影响和个人现金流决定。", en: "Refinance results are simplified estimates, not a lender quote, rate lock, or approval. Review total interest, tax impact, and personal cash flow."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.refinance)
        .navigationTitle(localized(language, zh: "重贷", en: "Refinance"))
    }

    private var interpretation: String {
        if result.monthlySavings <= 0 {
            return localized(language, zh: "新方案未降低月供，可能适合套现或调整期限，但不应只按月供判断。", en: "The new option does not lower monthly payment. It may still fit cash-out or term goals, but payment alone is not enough.")
        }
        if result.breakEvenMonths > 0 && holdMonths >= result.breakEvenMonths {
            return localized(language, zh: "按预计持有周期，月供节省可能覆盖 Closing Cost。预计持有期净变化约 \(LoanFormatter.currencyString(holdPeriodSavings))。", en: "Based on your holding period, payment savings may cover closing costs. Estimated hold-period net change: \(LoanFormatter.currencyString(holdPeriodSavings)).")
        }
        return localized(language, zh: "按预计持有周期，可能还没到回本时间。预计持有期净变化约 \(LoanFormatter.currencyString(holdPeriodSavings))。", en: "Based on your holding period, you may not reach break-even. Estimated hold-period net change: \(LoanFormatter.currencyString(holdPeriodSavings)).")
    }
}

#Preview {
    NavigationStack {
        RefinanceCalculatorView()
            .environment(\.appLanguage, .zhHans)
    }
}
