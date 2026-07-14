import SwiftUI

struct ClosingCostCalculatorView: View {
    @State private var homePrice: Double = 750_000
    @State private var downPayment: Double = 150_000

    @State private var processing: Double = 1_295
    @State private var underwriting: Double = 1_095
    @State private var points: Double = 0

    @State private var appraisal: Double = 750
    @State private var creditReport: Double = 85
    @State private var titleInsurance: Double = 1_850
    @State private var settlement: Double = 1_250
    @State private var recording: Double = 175
    @State private var transferTax: Double = 0
    @State private var miscellaneous: Double = 250

    @State private var noteRate: Double = 6.25
    @State private var annualPropertyTax: Double = 8_400
    @State private var annualInsurance: Double = 1_650
    @State private var taxEscrowMonths: Double = 3
    @State private var insuranceEscrowMonths: Double = 12
    @State private var closingDate: Date = .now

    @State private var lenderCredit: Double = 0
    @State private var sellerCredit: Double = 0
    @State private var transferTaxRate: Double = 0.12
    @State private var estimatedRecordingFee: Double = 175

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

    private var purchaseTax: PurchaseTaxSummary {
        CalculatorEngine.purchaseTaxSummary(
            annualPropertyTax: annualPropertyTax,
            homePrice: homePrice,
            transferTaxRate: transferTaxRate,
            recordingFee: estimatedRecordingFee
        )
    }

    var body: some View {
        Form {
            Section("房屋信息") {
                LabeledNumberField("房价", value: $homePrice)
                LabeledNumberField("首付", value: $downPayment)
                ResultRow("首付占比", value: LoanFormatter.percentString(downPercent))
                ResultRow("贷款金额", value: LoanFormatter.currencyString(summary.loanAmount))
            }

            Section("Lender Fees") {
                LabeledNumberField("Processing", value: $processing)
                LabeledNumberField("Underwriting", value: $underwriting)
                LabeledNumberField("Points", value: $points)
            }

            Section("Third Party + Title") {
                LabeledNumberField("Appraisal", value: $appraisal)
                LabeledNumberField("Credit Report", value: $creditReport)
                LabeledNumberField("Title Insurance", value: $titleInsurance)
                LabeledNumberField("Settlement", value: $settlement)
                LabeledNumberField("Recording", value: $recording)
                LabeledNumberField("Transfer Tax", value: $transferTax)
                LabeledNumberField("Misc", value: $miscellaneous)
            }

            Section("Prepaid / Escrow") {
                DatePicker("Closing Date", selection: $closingDate, displayedComponents: .date)
                LabeledNumberField("Note Rate (%)", value: $noteRate)
                LabeledNumberField("Property Tax / 年", value: $annualPropertyTax)
                LabeledNumberField("Insurance / 年", value: $annualInsurance)
                LabeledNumberField("Tax Escrow 月数", value: $taxEscrowMonths)
                LabeledNumberField("Insurance Escrow 月数", value: $insuranceEscrowMonths)
            }

            Section("Credits") {
                LabeledNumberField("Lender Credit", value: $lenderCredit)
                LabeledNumberField("Seller Credit", value: $sellerCredit)
            }

            Section("购房税费速算") {
                LabeledNumberField("Transfer Tax Rate (%)", value: $transferTaxRate)
                LabeledNumberField("Recording Fee", value: $estimatedRecordingFee)
                ResultRow("年度房产税", value: LoanFormatter.currencyString(purchaseTax.annualPropertyTax))
                ResultRow("Transfer Tax", value: LoanFormatter.currencyString(purchaseTax.transferTax))
                ResultRow("Recording Fee", value: LoanFormatter.currencyString(purchaseTax.recordingFee))
                ResultRow("税费合计", value: LoanFormatter.currencyString(purchaseTax.estimatedTotalTaxFees), prominent: true)
            }

            Section("结果") {
                ResultRow("Lender Fees", value: LoanFormatter.currencyString(summary.lenderFees))
                ResultRow("Third Party Fees", value: LoanFormatter.currencyString(summary.thirdPartyFees))
                ResultRow("Prepaid Days", value: "\(summary.prepaidDays)")
                ResultRow("Prepaid Interest", value: LoanFormatter.currencyString(summary.prepaidInterest))
                ResultRow("Tax Escrow", value: LoanFormatter.currencyString(summary.taxEscrowAmount))
                ResultRow("Insurance Escrow", value: LoanFormatter.currencyString(summary.insuranceEscrowAmount))
                ResultRow("Credits", value: LoanFormatter.currencyString(summary.totalCredits))
                ResultRow("Total Closing Cost", value: LoanFormatter.currencyString(summary.totalClosingCosts), prominent: true)
            }
        }
        .navigationTitle("过户费")
    }
}

#Preview {
    NavigationStack {
        ClosingCostCalculatorView()
    }
}
