import XCTest

final class CalculatorEngineTests: XCTestCase {
    func testMortgagePaymentUsesStandardAmortizationFormula() {
        let payment = CalculatorEngine.mortgagePayment(principal: 240_000, annualRate: 6.5, years: 30)

        XCTAssertEqual(payment, 1516.96, accuracy: 0.01)
    }

    func testMortgagePaymentWithZeroRateDividesPrincipalByMonths() {
        let payment = CalculatorEngine.mortgagePayment(principal: 120_000, annualRate: 0, years: 15)

        XCTAssertEqual(payment, 666.67, accuracy: 0.01)
    }

    func testPurchaseSummaryCalculatesLoanAmountLTVAndAutomaticPMI() {
        let result = CalculatorEngine.purchaseSummary(
            homePrice: 500_000,
            downPayment: 50_000,
            interestRate: 6,
            loanTerm: 30,
            propertyTaxAnnual: 6_000,
            insuranceAnnual: 1_800,
            pmiMonthlyInput: 0,
            hoaMonthly: 250,
            otherDebtsMonthly: 0,
            otherPropertiesMonthly: 0,
            otherPropertyPIMonthly: 0,
            rentalIncomeMonthly: 0,
            loanType: .conventional
        )

        XCTAssertEqual(result.loanAmount, 450_000, accuracy: 0.01)
        XCTAssertEqual(result.ltv, 90, accuracy: 0.01)
        XCTAssertEqual(result.pmiMonthly, 187.50, accuracy: 0.01)
        XCTAssertEqual(result.totalMonthly, result.principalInterest + 500 + 150 + 187.50 + 250, accuracy: 0.01)
    }

    func testPurchaseSummaryCalculatesDSCRForInvestmentLoan() {
        let result = CalculatorEngine.purchaseSummary(
            homePrice: 400_000,
            downPayment: 100_000,
            interestRate: 6.25,
            loanTerm: 30,
            propertyTaxAnnual: 4_800,
            insuranceAnnual: 1_200,
            pmiMonthlyInput: 0,
            hoaMonthly: 200,
            otherDebtsMonthly: 0,
            otherPropertiesMonthly: 0,
            otherPropertyPIMonthly: 0,
            rentalIncomeMonthly: 3_000,
            loanType: .dscr
        )

        XCTAssertNotNil(result.dscr)
        let principalInterest = CalculatorEngine.mortgagePayment(principal: 300_000, annualRate: 6.25, years: 30)
        let monthlyDebt = principalInterest + 400 + 100 + 200
        XCTAssertEqual(result.dscr ?? 0, 3_000 / monthlyDebt, accuracy: 0.01)
    }

    func testClosingMonthEndDaysCountsRemainingDaysAfterClosingDate() {
        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.year = 2026
        components.month = 7
        components.day = 13

        let date = components.date!

        XCTAssertEqual(CalculatorEngine.closingMonthEndDays(for: date), 18)
    }

    func testRefinanceSummaryUsesCurrentRemainingTermAndFinancedClosingCosts() {
        let result = CalculatorEngine.refinanceSummary(
            homeValue: 600_000,
            balance: 400_000,
            currentRate: 7,
            currentRemainingTerm: 25,
            newRate: 6,
            newTerm: 30,
            closingCosts: 8_000,
            financeClosingCosts: true,
            mode: .rateTerm,
            desiredCashOut: 0
        )

        XCTAssertEqual(result.newLoan, 408_000, accuracy: 0.01)
        XCTAssertEqual(result.closingCostsFinanced, 8_000, accuracy: 0.01)
        XCTAssertEqual(result.currentPayment, CalculatorEngine.mortgagePayment(principal: 400_000, annualRate: 7, years: 25), accuracy: 0.01)
        XCTAssertEqual(result.newPayment, CalculatorEngine.mortgagePayment(principal: 408_000, annualRate: 6, years: 30), accuracy: 0.01)
    }

    func testPolicyNewsSupportsCustomerFacingChineseAndEnglishCopy() throws {
        let data = """
        {
          "source": "Freddie Mac",
          "date": "2026-07-16",
          "title": "Mortgage rates averaged 6.55%",
          "title_zh": "房贷平均利率为 6.55%",
          "summary": "English summary",
          "summary_zh": "中文摘要",
          "url": "https://www.freddiemac.com/pmms"
        }
        """.data(using: .utf8)!

        let item = try JSONDecoder().decode(PolicyNewsItem.self, from: data)

        XCTAssertEqual(item.localizedTitle(for: .zhHans), "房贷平均利率为 6.55%")
        XCTAssertEqual(item.localizedTitle(for: .en), "Mortgage rates averaged 6.55%")
        XCTAssertEqual(item.localizedSummary(for: .zhHans), "中文摘要")
        XCTAssertEqual(item.localizedSummary(for: .en), "English summary")
    }
}
