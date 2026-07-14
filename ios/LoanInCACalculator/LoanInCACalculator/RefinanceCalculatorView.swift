import SwiftUI

struct RefinanceCalculatorView: View {
    @State private var mode: RefinanceMode = .rateTerm
    @State private var homeValue: Double = 500_000
    @State private var balance: Double = 320_000
    @State private var currentRate: Double = 7.0
    @State private var newRate: Double = 6.0
    @State private var newTerm: Double = 30
    @State private var closingCosts: Double = 6_000
    @State private var desiredCashOut: Double = 50_000

    private var result: RefinanceResult {
        CalculatorEngine.refinanceSummary(
            homeValue: homeValue,
            balance: balance,
            currentRate: currentRate,
            newRate: newRate,
            newTerm: Int(newTerm),
            closingCosts: closingCosts,
            mode: mode,
            desiredCashOut: desiredCashOut
        )
    }

    var body: some View {
        Form {
            Section {
                Picker("Refinance Mode", selection: $mode) {
                    ForEach(RefinanceMode.allCases) { item in
                        Text(item.title).tag(item)
                    }
                }
                .pickerStyle(.segmented)
            }

            Section("当前情况") {
                LabeledNumberField("房屋价值", value: $homeValue)
                LabeledNumberField("现有余额", value: $balance)
                LabeledNumberField("当前利率 (%)", value: $currentRate)
            }

            Section("新贷款") {
                LabeledNumberField("新利率 (%)", value: $newRate)
                LabeledNumberField("新期限 (年)", value: $newTerm)
                LabeledNumberField("Closing Costs", value: $closingCosts)

                if mode == .cashOut {
                    LabeledNumberField("计划套现", value: $desiredCashOut)
                }
            }

            Section("结果") {
                ResultRow("新贷款额", value: LoanFormatter.currencyString(result.newLoan))
                ResultRow("新 LTV", value: LoanFormatter.percentString(result.newLtv))
                ResultRow("当前月供", value: LoanFormatter.currencyString(result.currentPayment))
                ResultRow("新月供", value: LoanFormatter.currencyString(result.newPayment))
                ResultRow("每月变化", value: LoanFormatter.currencyString(result.monthlySavings), prominent: result.monthlySavings > 0)

                if mode == .cashOut {
                    ResultRow("可拿现金", value: LoanFormatter.currencyString(result.cashOut), prominent: true)
                } else {
                    ResultRow("Break Even", value: result.breakEvenMonths == 0 ? "N/A" : "\(result.breakEvenMonths) 个月")
                }
            }
        }
        .navigationTitle("重贷")
    }
}

#Preview {
    NavigationStack {
        RefinanceCalculatorView()
    }
}
