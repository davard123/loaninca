import SwiftUI

struct InvestmentComparisonView: View {
    @Environment(\.appLanguage) private var language

    @State private var initialAmount: Double = 50_000
    @State private var monthlyContribution: Double = 500
    @State private var years: Double = 10
    @State private var conservativeReturn: Double = 3
    @State private var neutralReturn: Double = 6
    @State private var aggressiveReturn: Double = 9
    @State private var mortgageRate: Double = 6.25
    @State private var rentalHomePrice: Double = 750_000
    @State private var rentalDownPayment: Double = 187_500
    @State private var rentalRate: Double = 7
    @State private var rentalTerm: Double = 30
    @State private var monthlyRent: Double = 4_200
    @State private var rentalTaxRate: Double = 1.1
    @State private var rentalInsuranceAnnual: Double = 1_800
    @State private var rentalHOA: Double = 250
    @State private var vacancyPercent: Double = 5
    @State private var managementPercent: Double = 8
    @State private var repairReserveMonthly: Double = 250

    private var scenarios: [(String, InvestmentComparisonSummary)] {
        [
            (localized(language, zh: "保守", en: "Conservative"), scenario(returnRate: conservativeReturn)),
            (localized(language, zh: "中性", en: "Neutral"), scenario(returnRate: neutralReturn)),
            (localized(language, zh: "积极", en: "Aggressive"), scenario(returnRate: aggressiveReturn))
        ]
    }

    private var rentalLoanAmount: Double {
        max(rentalHomePrice - rentalDownPayment, 0)
    }

    private var rentalPrincipalInterest: Double {
        CalculatorEngine.mortgagePayment(
            principal: rentalLoanAmount,
            annualRate: rentalRate,
            years: max(Int(rentalTerm), 1)
        )
    }

    private var rentalTaxMonthly: Double {
        rentalHomePrice * max(rentalTaxRate, 0) / 100 / 12
    }

    private var rentalInsuranceMonthly: Double {
        max(rentalInsuranceAnnual, 0) / 12
    }

    private var vacancyReserve: Double {
        max(monthlyRent, 0) * max(vacancyPercent, 0) / 100
    }

    private var managementReserve: Double {
        max(monthlyRent, 0) * max(managementPercent, 0) / 100
    }

    private var rentalOperatingIncome: Double {
        max(monthlyRent, 0) - vacancyReserve - managementReserve - max(repairReserveMonthly, 0)
    }

    private var rentalHousingPayment: Double {
        rentalPrincipalInterest + rentalTaxMonthly + rentalInsuranceMonthly + max(rentalHOA, 0)
    }

    private var rentalCashFlow: Double {
        rentalOperatingIncome - rentalHousingPayment
    }

    private var rentalDSCR: Double {
        guard rentalHousingPayment > 0 else { return 0 }
        return rentalOperatingIncome / rentalHousingPayment
    }

    var body: some View {
        Form {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "投资房现金流如何？", en: "How is the rental cash flow?"),
                    subtitle: localized(language, zh: "先填写租金和运营成本，再查看月现金流与 DSCR。", en: "Enter rent and operating costs, then review monthly cash flow and DSCR."),
                    icon: "chart.line.uptrend.xyaxis",
                    accent: LoanInCATheme.investment
                )
            }

            Section(localized(language, zh: "投资房现金流", en: "Rental Cash Flow")) {
                LabeledNumberField(localized(language, zh: "房价", en: "Home Price"), value: $rentalHomePrice)
                LabeledNumberField(localized(language, zh: "首付", en: "Down Payment"), value: $rentalDownPayment)
                LabeledNumberField(localized(language, zh: "利率 (%)", en: "Rate (%)"), value: $rentalRate)
                LabeledNumberField(localized(language, zh: "贷款年限", en: "Loan Term"), value: $rentalTerm)
                LabeledNumberField(localized(language, zh: "月租金", en: "Monthly Rent"), value: $monthlyRent)
            }

            Section(localized(language, zh: "运营假设", en: "Operating Assumptions")) {
                LabeledNumberField(localized(language, zh: "地税率 (%)", en: "Property Tax Rate (%)"), value: $rentalTaxRate)
                LabeledNumberField(localized(language, zh: "年保险", en: "Annual Insurance"), value: $rentalInsuranceAnnual)
                LabeledNumberField("HOA", value: $rentalHOA)
                LabeledNumberField(localized(language, zh: "空置预留 (%)", en: "Vacancy Reserve (%)"), value: $vacancyPercent)
                LabeledNumberField(localized(language, zh: "管理费 (%)", en: "Management Fee (%)"), value: $managementPercent)
                LabeledNumberField(localized(language, zh: "维修预留 / 月", en: "Repair Reserve / Month"), value: $repairReserveMonthly)
            }

            Section(localized(language, zh: "现金流结果", en: "Cash Flow Results")) {
                ResultHero(
                    label: localized(language, zh: "预计月现金流", en: "Estimated monthly cash flow"),
                    value: LoanFormatter.currencyString(rentalCashFlow),
                    detail: localized(language, zh: "租金减去运营预留与住房支出", en: "Rent less operating reserves and housing payment"),
                    accent: rentalCashFlow >= 0 ? LoanInCATheme.result : LoanInCATheme.warning
                )
                ResultRow(localized(language, zh: "贷款金额", en: "Loan Amount"), value: LoanFormatter.currencyString(rentalLoanAmount))
                ResultRow(localized(language, zh: "P&I", en: "P&I"), value: LoanFormatter.currencyString(rentalPrincipalInterest))
                ResultRow(localized(language, zh: "月住房支出", en: "Monthly Housing Payment"), value: LoanFormatter.currencyString(rentalHousingPayment))
                ResultRow(localized(language, zh: "运营后收入", en: "Operating Income"), value: LoanFormatter.currencyString(rentalOperatingIncome))
                ResultRow(localized(language, zh: "月现金流", en: "Monthly Cash Flow"), value: LoanFormatter.currencyString(rentalCashFlow), prominent: true)
                ResultRow("DSCR", value: String(format: "%.2f", rentalDSCR), prominent: true)
                Text(localized(language, zh: "DSCR = 运营后收入 / 月住房支出。很多投资房贷款会关注 DSCR，但不同贷款机构的口径和门槛不同。", en: "DSCR = operating income / monthly housing payment. Many investment-property loans consider DSCR, but lender definitions and thresholds vary."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "输入", en: "Inputs")) {
                LabeledNumberField(localized(language, zh: "初始金额", en: "Initial Amount"), value: $initialAmount)
                LabeledNumberField(localized(language, zh: "每月投入", en: "Monthly Contribution"), value: $monthlyContribution)
                LabeledNumberField(localized(language, zh: "比较年限", en: "Years"), value: $years)
                LabeledNumberField(localized(language, zh: "房贷利率 (%)", en: "Mortgage Rate (%)"), value: $mortgageRate)
            }

            Section(localized(language, zh: "收益情景", en: "Return Scenarios")) {
                LabeledNumberField(localized(language, zh: "保守年化 (%)", en: "Conservative Return (%)"), value: $conservativeReturn)
                LabeledNumberField(localized(language, zh: "中性年化 (%)", en: "Neutral Return (%)"), value: $neutralReturn)
                LabeledNumberField(localized(language, zh: "积极年化 (%)", en: "Aggressive Return (%)"), value: $aggressiveReturn)
            }

            Section(localized(language, zh: "对比结果", en: "Comparison")) {
                ForEach(scenarios, id: \.0) { name, summary in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(name)
                            .font(.headline)
                        ResultRow(localized(language, zh: "情景终值", en: "Scenario Future Value"), value: LoanFormatter.currencyString(summary.futureValueAtExpectedReturn), prominent: true)
                        ResultRow(localized(language, zh: "房贷利率基准", en: "Mortgage-Rate Benchmark"), value: LoanFormatter.currencyString(summary.futureValueAtMortgageRate))
                        ResultRow(localized(language, zh: "年化差", en: "Rate Spread"), value: LoanFormatter.percentString(summary.spread))
                    }
                    .padding(.vertical, 4)
                }
            }

            Section(localized(language, zh: "重要提示", en: "Important Notes")) {
                Text(localized(language, zh: "提前还贷的收益更接近减少利息支出，但会降低现金流动性。保留现金可能带来更高或更低回报，也可能亏损。", en: "Paying down a loan is closer to reducing interest cost but lowers liquidity. Keeping cash may produce higher or lower returns and may lose value."))
                Text(localized(language, zh: "本页不构成投资、税务或财务建议。请结合风险承受能力、应急金、税务影响和贷款条款评估。", en: "This page is not investment, tax, or financial advice. Consider risk tolerance, emergency reserves, tax impact, and loan terms."))
                    .foregroundStyle(.secondary)
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.investment)
        .navigationTitle(localized(language, zh: "现金策略", en: "Cash Strategy"))
    }

    private func scenario(returnRate: Double) -> InvestmentComparisonSummary {
        CalculatorEngine.investmentComparison(
            initialAmount: initialAmount,
            monthlyContribution: monthlyContribution,
            years: years,
            expectedAnnualReturn: returnRate,
            mortgageRate: mortgageRate
        )
    }
}

#Preview {
    NavigationStack {
        InvestmentComparisonView()
            .environment(\.appLanguage, .zhHans)
    }
}
