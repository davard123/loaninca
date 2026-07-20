import SwiftUI

struct PurchaseCalculatorView: View {
    @Environment(\.appLanguage) private var language
    @EnvironmentObject private var savedPlans: SavedPlansStore

    @State private var loanType: PurchaseLoanType = .conventional
    @State private var rateStructure: MortgageRateStructure = .fixed
    @State private var armProgram: ARMProgram = .fiveSix
    @State private var homePrice: Double = 300_000
    @State private var downPayment: Double = 60_000
    @State private var interestRate: Double = 6.5
    @State private var loanTerm: Int = 30
    @State private var propertyTaxAnnual: Double = 3_600
    @State private var insuranceAnnual: Double = 1_200
    @State private var pmiMonthly: Double = 0
    @State private var hoaMonthly: Double = 0
    @State private var otherDebtsMonthly: Double = 0
    @State private var otherPropertiesMonthly: Double = 0
    @State private var otherPropertyPIMonthly: Double = 0
    @State private var rentalIncomeMonthly: Double = 2_500
    @State private var planName: String = ""
    @State private var showSavedConfirmation = false

    private let loanTerms = [15, 20, 25, 30]

    private var downPercent: Double {
        guard homePrice > 0 else { return 0 }
        return downPayment / homePrice * 100
    }

    private var result: PurchaseResult {
        CalculatorEngine.purchaseSummary(
            homePrice: homePrice,
            downPayment: downPayment,
            interestRate: interestRate,
            loanTerm: loanTerm,
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
            years: loanTerm
        )
    }

    private var housingMonthly: Double {
        result.principalInterest + result.propertyTaxMonthly + result.insuranceMonthly + result.pmiMonthly + max(hoaMonthly, 0)
    }

    private var estimatedCashToClose: Double {
        max(downPayment, 0) + max(homePrice, 0) * 0.025
    }

    private var validationMessages: [String] {
        var messages: [String] = []
        if homePrice < 50_000 || homePrice > 20_000_000 {
            messages.append(localized(language, zh: "房价建议输入 $50,000 到 $20,000,000 之间。", en: "Home price should be between $50,000 and $20,000,000."))
        }
        if downPayment < 0 {
            messages.append(localized(language, zh: "首付不能为负数。", en: "Down payment cannot be negative."))
        }
        if downPayment > homePrice {
            messages.append(localized(language, zh: "首付不能超过房价。", en: "Down payment cannot exceed the home price."))
        }
        if result.loanAmount < 10_000 || result.loanAmount > 10_000_000 {
            messages.append(localized(language, zh: "贷款金额建议输入 $10,000 到 $10,000,000 之间。", en: "Loan amount should be between $10,000 and $10,000,000."))
        }
        if interestRate < 0.1 || interestRate > 20 {
            messages.append(localized(language, zh: "利率建议输入 0.1% 到 20% 之间。", en: "Interest rate should be between 0.1% and 20%."))
        }
        return messages
    }

    private var paymentComponents: [PaymentComponent] {
        [
            PaymentComponent(name: localized(language, zh: "P&I", en: "P&I"), value: result.principalInterest, color: .blue),
            PaymentComponent(name: localized(language, zh: "地税", en: "Tax"), value: result.propertyTaxMonthly, color: .green),
            PaymentComponent(name: localized(language, zh: "保险", en: "Insurance"), value: result.insuranceMonthly, color: .orange),
            PaymentComponent(name: localized(language, zh: "PMI", en: "PMI"), value: result.pmiMonthly, color: .purple),
            PaymentComponent(name: localized(language, zh: "HOA", en: "HOA"), value: max(hoaMonthly, 0), color: .pink)
        ]
    }

    var body: some View {
        Form {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "这套房每月实际要付多少？", en: "What is the real monthly payment?"),
                    subtitle: localized(language, zh: "蓝色边框是需要填写的项目，绿色数字是实时计算结果。", en: "Blue outlined controls are editable. Green values are live results."),
                    icon: "house.fill",
                    accent: LoanInCATheme.brand
                )
            }

            Section(localized(language, zh: "预计总月供", en: "Estimated Total Monthly")) {
                ResultHero(
                    label: localized(language, zh: "预计总月供", en: "Estimated total monthly"),
                    value: LoanFormatter.currencyString(housingMonthly),
                    detail: rateStructure == .fixed
                        ? localized(language, zh: "固定利率；包含 P&I、地税、保险、PMI 和 HOA", en: "Fixed rate; includes P&I, tax, insurance, PMI, and HOA")
                        : localized(language, zh: "\(armProgram.rawValue) ARM 初始利率；包含 P&I、税费、保险、PMI 和 HOA", en: "\(armProgram.rawValue) ARM initial rate; includes P&I, tax, insurance, PMI, and HOA")
                )
                .accessibilityElement(children: .combine)
                .accessibilityLabel(Text(localized(language, zh: "预计总月供 \(LoanFormatter.currencyString(housingMonthly))", en: "Estimated total monthly payment \(LoanFormatter.currencyString(housingMonthly))")))
            }

            Section(localized(language, zh: "贷款类型", en: "Loan Type")) {
                Picker(localized(language, zh: "贷款类型", en: "Loan Type"), selection: $loanType) {
                    ForEach(PurchaseLoanType.allCases) { type in
                        Text(type.title(for: language)).tag(type)
                    }
                }
                .pickerStyle(.menu)
            }

            Section(localized(language, zh: "利率结构", en: "Rate Structure")) {
                Picker(localized(language, zh: "利率结构", en: "Rate Structure"), selection: $rateStructure) {
                    ForEach(MortgageRateStructure.allCases) { structure in
                        Text(structure.title(for: language)).tag(structure)
                    }
                }
                .pickerStyle(.segmented)

                if rateStructure == .arm {
                    Picker(localized(language, zh: "ARM 方案", en: "ARM Program"), selection: $armProgram) {
                        ForEach(ARMProgram.allCases) { program in
                            Text(program.rawValue).tag(program)
                        }
                    }
                    .pickerStyle(.segmented)

                    GuidanceNote(text: armProgram.explanation(for: language))
                    GuidanceNote(
                        text: localized(language, zh: "当前月供只按初始利率估算；未来调整取决于指数、Margin 和利率上限。", en: "The current payment uses the initial rate only. Future adjustments depend on the index, margin, and rate caps."),
                        kind: .caution
                    )
                }
            }

            Section(localized(language, zh: "房屋与贷款", en: "Home and Loan")) {
                LabeledNumberField(localized(language, zh: "房价", en: "Home Price"), value: $homePrice)
                LabeledNumberField(localized(language, zh: "首付", en: "Down Payment"), value: $downPayment)
                ResultRow(localized(language, zh: "首付占比", en: "Down Payment %"), value: LoanFormatter.percentString(downPercent))
                LabeledNumberField(localized(language, zh: "利率 (%)", en: "Interest Rate (%)"), value: $interestRate)

                Picker(localized(language, zh: "贷款期限", en: "Loan Term"), selection: $loanTerm) {
                    ForEach(loanTerms, id: \.self) { term in
                        Text(localized(language, zh: "\(term) 年", en: "\(term) years")).tag(term)
                    }
                }
                .pickerStyle(.segmented)
                .accessibilityLabel(Text(localized(language, zh: "贷款期限", en: "Loan Term")))
            }

            if !validationMessages.isEmpty {
                Section(localized(language, zh: "请检查输入", en: "Check Inputs")) {
                    ForEach(validationMessages, id: \.self) { message in
                        Label(message, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                }
            }

            Section(localized(language, zh: "月供组成", en: "Monthly Cost Inputs")) {
                LabeledNumberField(localized(language, zh: "地税 / 年", en: "Property Tax / Year"), value: $propertyTaxAnnual)
                LabeledNumberField(localized(language, zh: "保险 / 年", en: "Insurance / Year"), value: $insuranceAnnual)
                LabeledNumberField(localized(language, zh: "PMI / 月", en: "PMI / Month"), value: $pmiMonthly)
                LabeledNumberField(localized(language, zh: "HOA / 月", en: "HOA / Month"), value: $hoaMonthly)
                LabeledNumberField(localized(language, zh: "其他负债 / 月", en: "Other Debts / Month"), value: $otherDebtsMonthly)
                LabeledNumberField(localized(language, zh: "其他房产月供 / 月", en: "Other Property Payment / Month"), value: $otherPropertiesMonthly)
                LabeledNumberField(localized(language, zh: "其他房产 P&I / 月", en: "Other Property P&I / Month"), value: $otherPropertyPIMonthly)
            }

            if loanType == .dscr {
                Section(localized(language, zh: "DSCR 假设", en: "DSCR Assumption")) {
                    LabeledNumberField(localized(language, zh: "预估租金收入 / 月", en: "Estimated Rent / Month"), value: $rentalIncomeMonthly)
                }
            }

            Section(localized(language, zh: "结果拆分", en: "Payment Breakdown")) {
                PaymentBreakdownChart(components: paymentComponents, total: housingMonthly)
                ResultRow(localized(language, zh: "P&I 本金利息", en: "P&I"), value: LoanFormatter.currencyString(result.principalInterest))
                ResultRow(localized(language, zh: "地税 / 月", en: "Property Tax / Month"), value: LoanFormatter.currencyString(result.propertyTaxMonthly))
                ResultRow(localized(language, zh: "保险 / 月", en: "Insurance / Month"), value: LoanFormatter.currencyString(result.insuranceMonthly))
                ResultRow(localized(language, zh: "PMI / 月", en: "PMI / Month"), value: LoanFormatter.currencyString(result.pmiMonthly))
                ResultRow(localized(language, zh: "HOA / 月", en: "HOA / Month"), value: LoanFormatter.currencyString(max(hoaMonthly, 0)))
                ResultRow(localized(language, zh: "贷款金额", en: "Loan Amount"), value: LoanFormatter.currencyString(result.loanAmount))
                ResultRow(localized(language, zh: "预计现金到交割", en: "Estimated Cash to Close"), value: LoanFormatter.currencyString(estimatedCashToClose), prominent: true)
                ResultRow("LTV", value: LoanFormatter.percentString(result.ltv))

                if let dscr = result.dscr {
                    ResultRow("DSCR", value: String(format: "%.2f", dscr), prominent: dscr >= 1.2)
                    Text(localized(language, zh: "DSCR 是租金收入与房产月债务的比值，数值越高通常代表现金流缓冲越大。", en: "DSCR compares rental income with property debt payments; a higher value usually means more cash-flow cushion."))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section(localized(language, zh: "收入参考", en: "Income Reference")) {
                ResultRow("36% DTI", value: LoanFormatter.currencyString(result.requiredIncome36))
                ResultRow("43% DTI", value: LoanFormatter.currencyString(result.requiredIncome43))
                ResultRow("50% DTI", value: LoanFormatter.currencyString(result.requiredIncome50))
                Text(localized(language, zh: "DTI 是月债务占月收入的比例。这里是简化估算，不代表贷款机构审批结果。", en: "DTI is monthly debt divided by monthly income. This is a simplified estimate and does not represent lender approval."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "估算依据", en: "Estimate Basis")) {
                Text(localized(language, zh: "月供按当前输入的房价、首付、利率、贷款期限、地税、保险、PMI 和 HOA 估算。PMI 在 LTV 超过 80% 且未手动输入时，按贷款金额的约 0.5% 年化估算。", en: "The estimate uses home price, down payment, rate, term, property tax, insurance, PMI, and HOA. When LTV is above 80% and PMI is blank, PMI is estimated at about 0.5% of loan amount annually."))
                if rateStructure == .arm {
                    Text(localized(language, zh: "\(armProgram.rawValue) ARM 只按初始利率计算当前月供，不预测首次调整后的利率或月供。", en: "The \(armProgram.rawValue) ARM result uses the initial rate and does not forecast the rate or payment after the first adjustment."))
                }
                Text(localized(language, zh: "现金到交割用首付加约 2.5% 房价的简化 Closing 估算展示；精确费用请进入 Closing 费用工具。", en: "Cash to close uses down payment plus a simplified 2.5% closing-cost estimate. Use the Closing Costs tool for detailed fees."))
                Text(localized(language, zh: "重要提示：结果不构成贷款报价、审批、税务建议或投资建议。实际条款取决于信用、收入、资产、房屋、地区、市场和贷款机构要求。", en: "Important: Results are not a loan quote, approval, tax advice, or investment advice. Actual terms depend on credit, income, assets, property, location, market conditions, and lender requirements."))
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "保存和分享", en: "Save and Share")) {
                TextField(localized(language, zh: "方案名称", en: "Plan Name"), text: $planName)
                    .textInputAutocapitalization(.words)
                    .accessibilityLabel(Text(localized(language, zh: "方案名称", en: "Plan Name")))

                Button {
                    saveCurrentPlan()
                } label: {
                    Label(localized(language, zh: "保存方案", en: "Save Plan"), systemImage: "folder.badge.plus")
                }

                ShareLink(item: currentShareText) {
                    Label(localized(language, zh: "分享摘要", en: "Share Summary"), systemImage: "square.and.arrow.up")
                }
            }

            Section(localized(language, zh: "术语说明", en: "Terms")) {
                DisclosureGroup("PMI") {
                    Text(localized(language, zh: "Private Mortgage Insurance，常见于首付较低的常规贷款，用于保护贷款机构。", en: "Private Mortgage Insurance, commonly used on lower-down-payment conventional loans to protect the lender."))
                }
                DisclosureGroup("LTV") {
                    Text(localized(language, zh: "贷款金额除以房价。LTV 越高，贷款风险和保险成本通常越高。", en: "Loan amount divided by home price. Higher LTV often means higher loan risk and insurance cost."))
                }
                DisclosureGroup("DTI") {
                    Text(localized(language, zh: "月债务除以月收入。贷款机构会结合其他条件评估。", en: "Monthly debt divided by monthly income. Lenders review it alongside other factors."))
                }
                DisclosureGroup("DSCR") {
                    Text(localized(language, zh: "租金收入除以房产月债务，常用于投资房现金流判断。", en: "Rental income divided by property debt payment, often used for rental property cash-flow review."))
                }
            }

            Section(localized(language, zh: "还款方式参考", en: "Amortization Reference")) {
                ResultRow(localized(language, zh: "等额本息月供", en: "Equal Payment Monthly"), value: LoanFormatter.currencyString(amortization.equalPaymentMonthly), prominent: true)
                ResultRow(localized(language, zh: "等额本息总利息", en: "Equal Payment Interest"), value: LoanFormatter.currencyString(amortization.equalPaymentTotalInterest))
                ResultRow(localized(language, zh: "等额本金首月", en: "Equal Principal First Month"), value: LoanFormatter.currencyString(amortization.equalPrincipalFirstMonth))
                ResultRow(localized(language, zh: "等额本金末月", en: "Equal Principal Last Month"), value: LoanFormatter.currencyString(amortization.equalPrincipalLastMonth))
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.brand)
        .navigationTitle(localized(language, zh: "买房月供", en: "Purchase Payment"))
        .alert(localized(language, zh: "已保存", en: "Saved"), isPresented: $showSavedConfirmation) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(localized(language, zh: "方案已保存到“方案”页。", en: "The plan was saved to the Plans tab."))
        }
    }

    private var currentShareText: String {
        let name = planName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? localized(language, zh: "买房月供方案", en: "Purchase Payment Plan")
            : planName
        return SavedPlan(
            id: UUID(),
            name: name,
            kind: .purchase,
            createdAt: .now,
            headline: localized(language, zh: "\(rateStructureLabel)，\(loanTerm) 年，LTV \(LoanFormatter.percentString(result.ltv))", en: "\(rateStructureLabel), \(loanTerm) years, LTV \(LoanFormatter.percentString(result.ltv))"),
            monthlyPayment: housingMonthly,
            loanAmount: result.loanAmount,
            cashToClose: estimatedCashToClose,
            notes: [
                localized(language, zh: "P&I \(LoanFormatter.currencyString(result.principalInterest))，地税 \(LoanFormatter.currencyString(result.propertyTaxMonthly))，保险 \(LoanFormatter.currencyString(result.insuranceMonthly))，PMI \(LoanFormatter.currencyString(result.pmiMonthly))，HOA \(LoanFormatter.currencyString(max(hoaMonthly, 0)))。", en: "P&I \(LoanFormatter.currencyString(result.principalInterest)), tax \(LoanFormatter.currencyString(result.propertyTaxMonthly)), insurance \(LoanFormatter.currencyString(result.insuranceMonthly)), PMI \(LoanFormatter.currencyString(result.pmiMonthly)), HOA \(LoanFormatter.currencyString(max(hoaMonthly, 0))).")
            ]
        ).shareText
    }

    private func saveCurrentPlan() {
        let cleanName = planName.trimmingCharacters(in: .whitespacesAndNewlines)
        let defaultName = localized(language, zh: "买房方案 \(Date().formatted(date: .numeric, time: .shortened))", en: "Purchase Plan \(Date().formatted(date: .numeric, time: .shortened))")
        savedPlans.add(
            SavedPlan(
                id: UUID(),
                name: cleanName.isEmpty ? defaultName : cleanName,
                kind: .purchase,
                createdAt: .now,
                headline: localized(language, zh: "\(rateStructureLabel)，\(loanTerm) 年，\(LoanFormatter.percentString(result.ltv)) LTV，预计月供 \(LoanFormatter.currencyString(housingMonthly))", en: "\(rateStructureLabel), \(loanTerm) years, \(LoanFormatter.percentString(result.ltv)) LTV, estimated monthly \(LoanFormatter.currencyString(housingMonthly))"),
                monthlyPayment: housingMonthly,
                loanAmount: result.loanAmount,
                cashToClose: estimatedCashToClose,
                notes: [
                    localized(language, zh: "仅用于预算规划，不构成贷款报价或审批。", en: "For budgeting only. Not a loan quote or approval.")
                ]
            )
        )
        showSavedConfirmation = true
    }

    private var rateStructureLabel: String {
        rateStructure == .fixed ? rateStructure.title(for: language) : "\(armProgram.rawValue) ARM"
    }
}

private struct PaymentComponent: Identifiable {
    let id = UUID()
    let name: String
    let value: Double
    let color: Color
}

private struct PaymentBreakdownChart: View {
    let components: [PaymentComponent]
    let total: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 2) {
                ForEach(components) { component in
                    Rectangle()
                        .fill(component.color)
                        .frame(maxWidth: barWidth(for: component.value), minHeight: 14, maxHeight: 14)
                        .accessibilityHidden(true)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))

            ForEach(components) { component in
                HStack {
                    Circle()
                        .fill(component.color)
                        .frame(width: 9, height: 9)
                    Text(component.name)
                    Spacer()
                    Text(LoanFormatter.currencyString(component.value))
                        .foregroundStyle(.secondary)
                }
                .font(.footnote)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text("Payment breakdown"))
    }

    private func barWidth(for value: Double) -> CGFloat {
        guard total > 0 else { return 1 }
        return max(CGFloat(value / total) * 280, value > 0 ? 8 : 1)
    }
}

#Preview {
    NavigationStack {
        PurchaseCalculatorView()
            .environment(\.appLanguage, .zhHans)
            .environmentObject(SavedPlansStore())
    }
}
