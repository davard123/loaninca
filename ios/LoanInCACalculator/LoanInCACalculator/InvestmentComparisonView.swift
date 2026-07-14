import SwiftUI

struct InvestmentComparisonView: View {
    @State private var initialAmount: Double = 50_000
    @State private var monthlyContribution: Double = 500
    @State private var years: Double = 10
    @State private var expectedAnnualReturn: Double = 7
    @State private var mortgageRate: Double = 6.25

    private var summary: InvestmentComparisonSummary {
        CalculatorEngine.investmentComparison(
            initialAmount: initialAmount,
            monthlyContribution: monthlyContribution,
            years: years,
            expectedAnnualReturn: expectedAnnualReturn,
            mortgageRate: mortgageRate
        )
    }

    var body: some View {
        Form {
            Section {
                Text("简单理财收益对比")
                    .font(.title3.bold())
                Text("把同一笔资金按预期理财收益和房贷利率基准分别折算，帮助用户快速判断“投资”还是“降杠杆”更有吸引力。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("输入") {
                LabeledNumberField("初始金额", value: $initialAmount)
                LabeledNumberField("每月投入", value: $monthlyContribution)
                LabeledNumberField("投资年限", value: $years)
                LabeledNumberField("预期年化 (%)", value: $expectedAnnualReturn)
                LabeledNumberField("房贷利率 (%)", value: $mortgageRate)
            }

            Section("对比结果") {
                ResultRow("预期收益率终值", value: LoanFormatter.currencyString(summary.futureValueAtExpectedReturn), prominent: true)
                ResultRow("按房贷利率折算终值", value: LoanFormatter.currencyString(summary.futureValueAtMortgageRate))
                ResultRow("预期投资收益", value: LoanFormatter.currencyString(summary.expectedGain))
                ResultRow("房贷利率基准收益", value: LoanFormatter.currencyString(summary.mortgageRateBenchmarkGain))
                ResultRow("收益率差", value: LoanFormatter.percentString(summary.spread))
            }

            Section("解读") {
                Text(summary.spread >= 0
                    ? "如果风险承受能力允许，预期理财收益高于房贷利率，这笔钱更值得比较投资方案。"
                    : "如果你更在意确定性，当前房贷利率不低，提前还贷或降低杠杆可能更稳。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("理财")
    }
}

#Preview {
    NavigationStack {
        InvestmentComparisonView()
    }
}
