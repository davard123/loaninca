import SwiftUI

struct IncomeCalculatorView: View {
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

    var body: some View {
        Form {
            Section("工作 1") {
                JobInputSection(
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
                        type: $secondaryType,
                        period: $secondaryPeriod,
                        amount: $secondaryAmount,
                        hourlyRate: $secondaryHourlyRate,
                        hoursPerWeek: $secondaryHours,
                        annualBonus: $secondaryBonus
                    )
                }
            } header: {
                Text("工作 2")
            }

            Section("自雇收入") {
                Picker("方式", selection: $selfEmploymentMethod) {
                    ForEach(SelfEmploymentMethod.allCases) { method in
                        Text(method.title).tag(method)
                    }
                }
                .pickerStyle(.segmented)

                LabeledNumberField("持股比例 (%)", value: $ownershipPercent)
                LabeledNumberField("Year 1 Net Income", value: $year1Income)
                LabeledNumberField("Year 2 Net Income", value: $year2Income)
                LabeledNumberField("Year 1 Depreciation", value: $year1Depreciation)
                LabeledNumberField("Year 2 Depreciation", value: $year2Depreciation)
            }

            Section("租金与其他") {
                LabeledNumberField("Schedule E 年收入", value: $scheduleEAnnual)
                LabeledNumberField("Lease 月数", value: $leaseMonths)
                LabeledNumberField("Child Support / 月", value: $childSupport)
                LabeledNumberField("Social Security / 月", value: $socialSecurity)
                LabeledNumberField("Other Income / 月", value: $otherIncome)
            }

            Section("结果") {
                ResultRow("工作 1 月收入", value: LoanFormatter.currencyString(summary.primaryJobMonthly))
                ResultRow("工作 2 月收入", value: LoanFormatter.currencyString(summary.secondaryJobMonthly))
                ResultRow("自雇月收入", value: LoanFormatter.currencyString(summary.selfEmploymentMonthly))
                ResultRow("租金月收入 (75%)", value: LoanFormatter.currencyString(summary.rentalMonthly))
                ResultRow("赡养费 / 月", value: LoanFormatter.currencyString(summary.childSupportMonthly))
                ResultRow("社保 / 月", value: LoanFormatter.currencyString(summary.socialSecurityMonthly))
                ResultRow("其他 / 月", value: LoanFormatter.currencyString(summary.otherMonthly))
                ResultRow("总月收入", value: LoanFormatter.currencyString(summary.totalMonthly), prominent: true)
            }
        }
        .navigationTitle("收入")
    }
}

private struct JobInputSection: View {
    @Binding var type: JobIncomeType
    @Binding var period: PayPeriod
    @Binding var amount: Double
    @Binding var hourlyRate: Double
    @Binding var hoursPerWeek: Double
    @Binding var annualBonus: Double

    var body: some View {
        Picker("收入类型", selection: $type) {
            ForEach(JobIncomeType.allCases) { item in
                Text(item.title).tag(item)
            }
        }
        .pickerStyle(.segmented)

        if type == .w2 {
            Picker("发薪周期", selection: $period) {
                ForEach(PayPeriod.allCases) { item in
                    Text(item.title).tag(item)
                }
            }
            LabeledNumberField("金额", value: $amount)
        } else {
            LabeledNumberField("时薪", value: $hourlyRate)
            LabeledNumberField("每周工时", value: $hoursPerWeek)
            LabeledNumberField("年奖金", value: $annualBonus)
        }
    }
}

#Preview {
    NavigationStack {
        IncomeCalculatorView()
    }
}
