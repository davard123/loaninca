import SwiftUI

struct IncomeCalculatorView: View {
    @Environment(\.appLanguage) private var language

    @State private var primaryType: JobIncomeType = .w2
    @State private var primaryPeriod: PayPeriod = .monthly
    @State private var primaryAmount: Double = 8_000
    @State private var primaryHourlyRate: Double = 0
    @State private var primaryHours: Double = 0
    @State private var primaryBonus: Double = 0

    @State private var secondaryEnabled = false
    @State private var secondaryType: JobIncomeType = .w2
    @State private var secondaryPeriod: PayPeriod = .monthly
    @State private var secondaryAmount: Double = 0
    @State private var secondaryHourlyRate: Double = 0
    @State private var secondaryHours: Double = 0
    @State private var secondaryBonus: Double = 0

    @State private var selfEmploymentMethod: SelfEmploymentMethod = .du
    @State private var ownershipPercent: Double = 100
    @State private var year1Income: Double = 0
    @State private var year2Income: Double = 0
    @State private var year1Depreciation: Double = 0
    @State private var year2Depreciation: Double = 0

    @State private var scheduleEAnnual: Double = 0
    @State private var leaseMonths: Double = 12
    @State private var childSupport: Double = 0
    @State private var socialSecurity: Double = 0
    @State private var otherIncome: Double = 0

    private var primaryJobMonthly: Double {
        CalculatorEngine.monthlyEmploymentIncome(
            type: primaryType,
            period: primaryPeriod,
            w2Amount: primaryAmount,
            hourlyRate: primaryHourlyRate,
            hoursPerWeek: primaryHours,
            annualBonus: primaryBonus
        )
    }

    private var secondaryJobMonthly: Double {
        guard secondaryEnabled else { return 0 }
        return CalculatorEngine.monthlyEmploymentIncome(
            type: secondaryType,
            period: secondaryPeriod,
            w2Amount: secondaryAmount,
            hourlyRate: secondaryHourlyRate,
            hoursPerWeek: secondaryHours,
            annualBonus: secondaryBonus
        )
    }

    private var selfEmploymentMonthly: Double {
        CalculatorEngine.monthlySelfEmploymentIncome(
            method: selfEmploymentMethod,
            ownershipPercent: ownershipPercent,
            year1Income: year1Income,
            year2Income: year2Income,
            year1Depreciation: year1Depreciation,
            year2Depreciation: year2Depreciation
        )
    }

    private var rentalMonthly: Double {
        CalculatorEngine.monthlyRentalIncome(scheduleEAnnual: scheduleEAnnual, leaseMonths: leaseMonths)
    }

    private var summary: IncomeSummary {
        CalculatorEngine.incomeSummary(
            primaryJobMonthly: primaryJobMonthly,
            secondaryJobMonthly: secondaryJobMonthly,
            selfEmploymentMonthly: selfEmploymentMonthly,
            rentalMonthly: rentalMonthly,
            childSupportMonthly: childSupport,
            socialSecurityMonthly: socialSecurity,
            otherMonthly: otherIncome
        )
    }

    private var estimatedAffordableMonthlyPayment: Double {
        summary.totalMonthly * 0.36
    }

    private var estimatedAffordableLoanAmount: Double {
        let paymentPerDollar = CalculatorEngine.mortgagePayment(principal: 1, annualRate: 6.5, years: 30)
        guard paymentPerDollar > 0 else { return 0 }
        return estimatedAffordableMonthlyPayment / paymentPerDollar
    }

    private var estimatedAffordableHomePrice: Double {
        estimatedAffordableLoanAmount / 0.8
    }

    var body: some View {
        Form {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "我能买多少钱？", en: "How much can I afford?"),
                    subtitle: localized(language, zh: "填写收入来源，绿色结果会显示可参考的房价预算。", en: "Enter income sources to see a reference home-price budget in green."),
                    icon: "chart.bar.fill",
                    accent: LoanInCATheme.action
                )
            }

            Section(localized(language, zh: "预算参考", en: "Budget Reference")) {
                ResultHero(
                    label: localized(language, zh: "可负担房价参考", en: "Affordable home reference"),
                    value: LoanFormatter.currencyString(estimatedAffordableHomePrice),
                    detail: localized(language, zh: "假设 20% 首付、30 年和 6.5% 利率", en: "Assumes 20% down, 30 years, and 6.5% rate")
                )
                ResultRow(localized(language, zh: "总月收入", en: "Total Monthly Income"), value: LoanFormatter.currencyString(summary.totalMonthly), prominent: true)
                ResultRow(localized(language, zh: "36% DTI 月供预算", en: "36% DTI Payment Budget"), value: LoanFormatter.currencyString(estimatedAffordableMonthlyPayment))
                ResultRow(localized(language, zh: "可负担贷款额参考", en: "Affordable Loan Reference"), value: LoanFormatter.currencyString(estimatedAffordableLoanAmount))
                ResultRow(localized(language, zh: "可负担房价参考", en: "Affordable Home Price Reference"), value: LoanFormatter.currencyString(estimatedAffordableHomePrice), prominent: true)
                Text(localized(language, zh: "假设 20% 首付、30 年、6.5% 利率，仅用于预算规划，不代表审批。", en: "Assumes 20% down, 30 years, and 6.5% rate for planning only. Not an approval."))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section(localized(language, zh: "工作 1", en: "Job 1")) {
                JobInputSection(
                    language: language,
                    type: $primaryType,
                    period: $primaryPeriod,
                    amount: $primaryAmount,
                    hourlyRate: $primaryHourlyRate,
                    hoursPerWeek: $primaryHours,
                    annualBonus: $primaryBonus
                )
            }

            Section {
                Toggle("启用工作 2", isOn: $secondaryEnabled)

                if secondaryEnabled {
                    JobInputSection(
                        language: language,
                        type: $secondaryType,
                        period: $secondaryPeriod,
                        amount: $secondaryAmount,
                        hourlyRate: $secondaryHourlyRate,
                        hoursPerWeek: $secondaryHours,
                        annualBonus: $secondaryBonus
                    )
                }
            } header: {
                Text(localized(language, zh: "工作 2", en: "Job 2"))
            }

            Section(localized(language, zh: "自雇收入", en: "Self-Employment Income")) {
                Picker(localized(language, zh: "方式", en: "Method"), selection: $selfEmploymentMethod) {
                    ForEach(SelfEmploymentMethod.allCases) { method in
                        Text(method.title(for: language)).tag(method)
                    }
                }
                .pickerStyle(.segmented)

                LabeledNumberField(localized(language, zh: "持股比例 (%)", en: "Ownership (%)"), value: $ownershipPercent)
                LabeledNumberField(localized(language, zh: "第 1 年净收入", en: "Year 1 Net Income"), value: $year1Income)
                LabeledNumberField(localized(language, zh: "第 2 年净收入", en: "Year 2 Net Income"), value: $year2Income)
                LabeledNumberField(localized(language, zh: "第 1 年折旧", en: "Year 1 Depreciation"), value: $year1Depreciation)
                LabeledNumberField(localized(language, zh: "第 2 年折旧", en: "Year 2 Depreciation"), value: $year2Depreciation)
            }

            Section(localized(language, zh: "租金与其他", en: "Rental and Other")) {
                LabeledNumberField(localized(language, zh: "Schedule E 年收入", en: "Schedule E Annual Income"), value: $scheduleEAnnual)
                LabeledNumberField(localized(language, zh: "租约月数", en: "Lease Months"), value: $leaseMonths)
                LabeledNumberField(localized(language, zh: "赡养费 / 月", en: "Child Support / Month"), value: $childSupport)
                LabeledNumberField(localized(language, zh: "社保 / 月", en: "Social Security / Month"), value: $socialSecurity)
                LabeledNumberField(localized(language, zh: "其他收入 / 月", en: "Other Income / Month"), value: $otherIncome)
            }

            Section(localized(language, zh: "收入明细", en: "Income Breakdown")) {
                ResultRow(localized(language, zh: "工作 1 月收入", en: "Job 1 Monthly"), value: LoanFormatter.currencyString(summary.primaryJobMonthly))
                ResultRow(localized(language, zh: "工作 2 月收入", en: "Job 2 Monthly"), value: LoanFormatter.currencyString(summary.secondaryJobMonthly))
                ResultRow(localized(language, zh: "自雇月收入", en: "Self-Employment Monthly"), value: LoanFormatter.currencyString(summary.selfEmploymentMonthly))
                ResultRow(localized(language, zh: "租金月收入 (75%)", en: "Rental Monthly (75%)"), value: LoanFormatter.currencyString(summary.rentalMonthly))
                ResultRow(localized(language, zh: "赡养费 / 月", en: "Support / Month"), value: LoanFormatter.currencyString(summary.childSupportMonthly))
                ResultRow(localized(language, zh: "社保 / 月", en: "Social Security / Month"), value: LoanFormatter.currencyString(summary.socialSecurityMonthly))
                ResultRow(localized(language, zh: "其他 / 月", en: "Other / Month"), value: LoanFormatter.currencyString(summary.otherMonthly))
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.action)
        .navigationTitle(localized(language, zh: "收入", en: "Income"))
    }
}

private struct JobInputSection: View {
    let language: AppLanguage
    @Binding var type: JobIncomeType
    @Binding var period: PayPeriod
    @Binding var amount: Double
    @Binding var hourlyRate: Double
    @Binding var hoursPerWeek: Double
    @Binding var annualBonus: Double

    var body: some View {
        Picker(localized(language, zh: "收入类型", en: "Income Type"), selection: $type) {
            ForEach(JobIncomeType.allCases) { item in
                Text(item.title(for: language)).tag(item)
            }
        }
        .pickerStyle(.segmented)

        if type == .w2 {
            Picker(localized(language, zh: "发薪周期", en: "Pay Period"), selection: $period) {
                ForEach(PayPeriod.allCases) { item in
                    Text(item.title(for: language)).tag(item)
                }
            }
            LabeledNumberField(localized(language, zh: "金额", en: "Amount"), value: $amount)
        } else {
            LabeledNumberField(localized(language, zh: "时薪", en: "Hourly Rate"), value: $hourlyRate)
            LabeledNumberField(localized(language, zh: "每周工时", en: "Hours per Week"), value: $hoursPerWeek)
            LabeledNumberField(localized(language, zh: "年奖金", en: "Annual Bonus"), value: $annualBonus)
        }
    }
}

#Preview {
    NavigationStack {
        IncomeCalculatorView()
            .environment(\.appLanguage, .zhHans)
    }
}
