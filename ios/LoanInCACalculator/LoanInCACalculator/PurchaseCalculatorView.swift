import SwiftUI

struct PurchaseCalculatorView: View {
    @State private var loanType: PurchaseLoanType = .conventional
    @State private var homePrice: Double = 300_000
    @State private var downPayment: Double = 60_000
    @State private var interestRate: Double = 6.5
    @State private var propertyTaxAnnual: Double = 3_600
    @State private var insuranceAnnual: Double = 1_200
    @State private var pmiMonthly: Double = 0
    @State private var hoaMonthly: Double = 0
    @State private var otherDebtsMonthly: Double = 0
    @State private var otherPropertiesMonthly: Double = 0
    @State private var otherPropertyPIMonthly: Double = 0
    @State private var rentalIncomeMonthly: Double = 2_500

    private var downPercent: Double {
        guard homePrice > 0 else { return 0 }
        return downPayment / homePrice * 100
    }

    private var result: PurchaseResult {
        CalculatorEngine.purchaseSummary(
            homePrice: homePrice,
            downPayment: downPayment,
            interestRate: interestRate,
            loanTerm: 30,
            propertyTaxAnnual: propertyTaxAnnual,
            insuranceAnnual: insuranceAnnual,
            pmiMonthlyInput: pmiMonthly,
            hoaMonthly: hoaMonthly,
            otherDebtsMonthly: otherDebtsMonthly,
            otherPropertiesMonthly: otherPropertiesMonthly,
            otherPropertyPIMonthly: otherPropertyPIMonthly,
            rentalIncomeMonthly: rentalIncomeMonthly,
            loanType: loanType
        )
    }

    private var amortization: AmortizationComparison {
        CalculatorEngine.amortizationComparison(
            principal: result.loanAmount,
            annualRate: interestRate,
            years: 30
        )
    }

    var body: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text("LoanInCA 买房计算器")
                        .font(.title2.bold())
                    Text("把网页里的核心买房逻辑迁移成原生 SwiftUI。")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Section("贷款类型") {
                Picker("Loan Type", selection: $loanType) {
                    ForEach(PurchaseLoanType.allCases) { type in
                        Text(type.title).tag(type)
                    }
                }
                .pickerStyle(.segmented)

                if loanType == .fha || loanType == .va {
                    Text("FHA / VA 的地区限额大数据表还没有从网页完整迁入，当前先保留核心月供和 LTV 计算。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("房屋与贷款") {
                LabeledNumberField("房价", value: $homePrice)
                LabeledNumberField("首付", value: $downPayment)
                HStack {
                    Text("首付占比")
                    Spacer()
                    Text(LoanFormatter.percentString(downPercent))
                        .foregroundStyle(.secondary)
                }
                LabeledNumberField("利率 (%)", value: $interestRate)
            }

            Section("月供组成") {
                LabeledNumberField("地税 / 年", value: $propertyTaxAnnual)
                LabeledNumberField("保险 / 年", value: $insuranceAnnual)
                LabeledNumberField("PMI / 月", value: $pmiMonthly)
                LabeledNumberField("HOA / 月", value: $hoaMonthly)
                LabeledNumberField("其他负债 / 月", value: $otherDebtsMonthly)
                LabeledNumberField("其他房产月供 / 月", value: $otherPropertiesMonthly)
                LabeledNumberField("其他房产 P&I / 月", value: $otherPropertyPIMonthly)
            }

            if loanType == .dscr {
                Section("DSCR") {
                    LabeledNumberField("预估租金收入 / 月", value: $rentalIncomeMonthly)
                }
            }

            Section("结果") {
                ResultRow("贷款金额", value: LoanFormatter.currencyString(result.loanAmount))
                ResultRow("LTV", value: LoanFormatter.percentString(result.ltv))
                ResultRow("P&I", value: LoanFormatter.currencyString(result.principalInterest))
                ResultRow("Property Tax / 月", value: LoanFormatter.currencyString(result.propertyTaxMonthly))
                ResultRow("Insurance / 月", value: LoanFormatter.currencyString(result.insuranceMonthly))
                ResultRow("PMI / 月", value: LoanFormatter.currencyString(result.pmiMonthly))
                ResultRow("总月供", value: LoanFormatter.currencyString(result.totalMonthly), prominent: true)

                if let dscr = result.dscr {
                    ResultRow("DSCR", value: String(format: "%.2f", dscr), prominent: dscr >= 1.2)
                    Text(dscr >= 1.2 ? "DSCR 达标，现金流表现健康。" : dscr >= 1.0 ? "DSCR 为正，但还可以继续优化。" : "DSCR 低于 1，现金流偏弱。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("还款方式对比") {
                ResultRow("等额本息月供", value: LoanFormatter.currencyString(amortization.equalPaymentMonthly), prominent: true)
                ResultRow("等额本息总利息", value: LoanFormatter.currencyString(amortization.equalPaymentTotalInterest))
                ResultRow("等额本金首月", value: LoanFormatter.currencyString(amortization.equalPrincipalFirstMonth))
                ResultRow("等额本金末月", value: LoanFormatter.currencyString(amortization.equalPrincipalLastMonth))
                ResultRow("等额本金总利息", value: LoanFormatter.currencyString(amortization.equalPrincipalTotalInterest))

                let savings = amortization.equalPaymentTotalInterest - amortization.equalPrincipalTotalInterest
                Text("如果现金流允许，等额本金通常总利息更低，当前模型下大约少付 \(LoanFormatter.currencyString(savings))。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("收入门槛") {
                ResultRow("36% DTI", value: LoanFormatter.currencyString(result.requiredIncome36))
                ResultRow("43% DTI", value: LoanFormatter.currencyString(result.requiredIncome43))
                ResultRow("50% DTI", value: LoanFormatter.currencyString(result.requiredIncome50))
            }
        }
        .navigationTitle("买房")
    }
}

#Preview {
    NavigationStack {
        PurchaseCalculatorView()
    }
}
