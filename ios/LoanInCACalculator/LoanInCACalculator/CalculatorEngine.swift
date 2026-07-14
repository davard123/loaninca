import Foundation

enum CalculatorEngine {
    static func mortgagePayment(principal: Double, annualRate: Double, years: Int) -> Double {
        let safePrincipal = max(principal, 0)
        let monthlyRate = annualRate / 100 / 12
        let numberOfPayments = Double(max(years, 1) * 12)

        if monthlyRate == 0 {
            return safePrincipal / numberOfPayments
        }

        let growth = pow(1 + monthlyRate, numberOfPayments)
        return safePrincipal * (monthlyRate * growth) / (growth - 1)
    }

    static func purchaseSummary(
        homePrice: Double,
        downPayment: Double,
        interestRate: Double,
        loanTerm: Int,
        propertyTaxAnnual: Double,
        insuranceAnnual: Double,
        pmiMonthlyInput: Double,
        hoaMonthly: Double,
        otherDebtsMonthly: Double,
        otherPropertiesMonthly: Double,
        otherPropertyPIMonthly: Double,
        rentalIncomeMonthly: Double,
        loanType: PurchaseLoanType
    ) -> PurchaseResult {
        let safeHomePrice = max(homePrice, 0)
        let loanAmount = max(safeHomePrice - downPayment, 0)
        let ltv = safeHomePrice == 0 ? 0 : (loanAmount / safeHomePrice) * 100
        let autoPMI = ltv > 80 && pmiMonthlyInput == 0 ? (loanAmount * 0.005) / 12 : pmiMonthlyInput
        let principalInterest = mortgagePayment(principal: loanAmount, annualRate: interestRate, years: loanTerm)
        let propertyTaxMonthly = max(propertyTaxAnnual, 0) / 12
        let insuranceMonthly = max(insuranceAnnual, 0) / 12
        let totalMonthly = principalInterest
            + propertyTaxMonthly
            + insuranceMonthly
            + max(hoaMonthly, 0)
            + max(autoPMI, 0)
            + max(otherDebtsMonthly, 0)
            + max(otherPropertiesMonthly, 0)
            + max(otherPropertyPIMonthly, 0)

        let totalMonthlyDebt = totalMonthly
        let dscr: Double?
        if loanType == .dscr {
            let monthlyDebt = principalInterest + propertyTaxMonthly + insuranceMonthly + max(hoaMonthly, 0)
            dscr = monthlyDebt == 0 ? nil : rentalIncomeMonthly / monthlyDebt
        } else {
            dscr = nil
        }

        return PurchaseResult(
            loanAmount: loanAmount,
            ltv: ltv,
            principalInterest: principalInterest,
            propertyTaxMonthly: propertyTaxMonthly,
            insuranceMonthly: insuranceMonthly,
            pmiMonthly: autoPMI,
            totalMonthly: totalMonthly,
            totalMonthlyDebt: totalMonthlyDebt,
            requiredIncome36: totalMonthlyDebt / 0.36,
            requiredIncome43: totalMonthlyDebt / 0.43,
            requiredIncome50: totalMonthlyDebt / 0.50,
            dscr: dscr
        )
    }

    static func amortizationComparison(
        principal: Double,
        annualRate: Double,
        years: Int
    ) -> AmortizationComparison {
        let safePrincipal = max(principal, 0)
        let monthlyRate = annualRate / 100 / 12
        let totalMonths = Double(max(years, 1) * 12)
        let equalPaymentMonthly = mortgagePayment(principal: safePrincipal, annualRate: annualRate, years: years)
        let equalPaymentTotalInterest = (equalPaymentMonthly * totalMonths) - safePrincipal

        let monthlyPrincipal = totalMonths == 0 ? 0 : safePrincipal / totalMonths
        let equalPrincipalFirstMonth = monthlyPrincipal + safePrincipal * monthlyRate
        let equalPrincipalLastMonth = monthlyPrincipal + monthlyPrincipal * monthlyRate
        let equalPrincipalTotalInterest = ((totalMonths + 1) * safePrincipal * monthlyRate) / 2

        return AmortizationComparison(
            equalPaymentMonthly: equalPaymentMonthly,
            equalPaymentTotalInterest: equalPaymentTotalInterest,
            equalPrincipalFirstMonth: equalPrincipalFirstMonth,
            equalPrincipalLastMonth: equalPrincipalLastMonth,
            equalPrincipalTotalInterest: equalPrincipalTotalInterest
        )
    }

    static func refinanceSummary(
        homeValue: Double,
        balance: Double,
        currentRate: Double,
        newRate: Double,
        newTerm: Int,
        closingCosts: Double,
        mode: RefinanceMode,
        desiredCashOut: Double
    ) -> RefinanceResult {
        let currentPayment = mortgagePayment(principal: max(balance, 0), annualRate: currentRate, years: 30)
        let newLoan = mode == .cashOut
            ? max(balance, 0) + max(desiredCashOut, 0) + max(closingCosts, 0)
            : max(balance, 0)
        let newPayment = mortgagePayment(principal: newLoan, annualRate: newRate, years: newTerm)
        let newLtv = homeValue == 0 ? 0 : (newLoan / homeValue) * 100
        let monthlySavings = currentPayment - newPayment
        let breakEvenMonths = monthlySavings > 0 ? Int(ceil(max(closingCosts, 0) / monthlySavings)) : 0

        return RefinanceResult(
            newLoan: newLoan,
            newLtv: newLtv,
            currentPayment: currentPayment,
            newPayment: newPayment,
            monthlySavings: monthlySavings,
            breakEvenMonths: breakEvenMonths,
            cashOut: mode == .cashOut ? max(desiredCashOut, 0) : 0
        )
    }

    static func monthlyEmploymentIncome(
        type: JobIncomeType,
        period: PayPeriod,
        w2Amount: Double,
        hourlyRate: Double,
        hoursPerWeek: Double,
        annualBonus: Double
    ) -> Double {
        switch type {
        case .w2:
            switch period {
            case .monthly:
                return max(w2Amount, 0)
            case .biweekly:
                return max(w2Amount, 0) * 26 / 12
            case .weekly:
                return max(w2Amount, 0) * 52 / 12
            case .annually:
                return max(w2Amount, 0) / 12
            }
        case .hourly:
            return (max(hourlyRate, 0) * max(hoursPerWeek, 0) * 52 / 12) + (max(annualBonus, 0) / 12)
        }
    }

    static func monthlySelfEmploymentIncome(
        method: SelfEmploymentMethod,
        ownershipPercent: Double,
        year1Income: Double,
        year2Income: Double,
        year1Depreciation: Double,
        year2Depreciation: Double
    ) -> Double {
        let ownershipRatio = max(min(ownershipPercent, 100), 0) / 100
        switch method {
        case .du:
            return ((max(year1Income, 0) + max(year2Income, 0) + max(year1Depreciation, 0) + max(year2Depreciation, 0)) / 24) * ownershipRatio
        case .lp:
            return ((max(year1Income, 0) + max(year1Depreciation, 0)) / 12) * ownershipRatio
        }
    }

    static func monthlyRentalIncome(scheduleEAnnual: Double, leaseMonths: Double) -> Double {
        let months = max(leaseMonths, 1)
        return (max(scheduleEAnnual, 0) / months) * 0.75
    }

    static func incomeSummary(
        primaryJobMonthly: Double,
        secondaryJobMonthly: Double,
        selfEmploymentMonthly: Double,
        rentalMonthly: Double,
        childSupportMonthly: Double,
        socialSecurityMonthly: Double,
        otherMonthly: Double
    ) -> IncomeSummary {
        let total = max(primaryJobMonthly, 0)
            + max(secondaryJobMonthly, 0)
            + max(selfEmploymentMonthly, 0)
            + max(rentalMonthly, 0)
            + max(childSupportMonthly, 0)
            + max(socialSecurityMonthly, 0)
            + max(otherMonthly, 0)

        return IncomeSummary(
            primaryJobMonthly: max(primaryJobMonthly, 0),
            secondaryJobMonthly: max(secondaryJobMonthly, 0),
            selfEmploymentMonthly: max(selfEmploymentMonthly, 0),
            rentalMonthly: max(rentalMonthly, 0),
            childSupportMonthly: max(childSupportMonthly, 0),
            socialSecurityMonthly: max(socialSecurityMonthly, 0),
            otherMonthly: max(otherMonthly, 0),
            totalMonthly: total
        )
    }

    static func closingMonthEndDays(for date: Date) -> Int {
        let calendar = Calendar(identifier: .gregorian)
        let day = calendar.component(.day, from: date)
        guard let range = calendar.range(of: .day, in: .month, for: date) else {
            return 0
        }
        return max(0, range.count - day)
    }

    static func closingCostSummary(
        homePrice: Double,
        downPayment: Double,
        processing: Double,
        underwriting: Double,
        points: Double,
        appraisal: Double,
        creditReport: Double,
        titleInsurance: Double,
        settlement: Double,
        recording: Double,
        transferTax: Double,
        miscellaneous: Double,
        noteRate: Double,
        annualPropertyTax: Double,
        annualInsurance: Double,
        taxEscrowMonths: Double,
        insuranceEscrowMonths: Double,
        closingDate: Date,
        lenderCredit: Double,
        sellerCredit: Double
    ) -> ClosingCostSummary {
        let lenderFees = max(processing, 0) + max(underwriting, 0) + max(points, 0)
        let thirdPartyFees = max(appraisal, 0)
            + max(creditReport, 0)
            + max(titleInsurance, 0)
            + max(settlement, 0)
            + max(recording, 0)
            + max(transferTax, 0)
            + max(miscellaneous, 0)
        let loanAmount = max(homePrice - downPayment, 0)
        let prepaidDays = closingMonthEndDays(for: closingDate)
        let prepaidInterest = loanAmount * (noteRate / 100) / 365 * Double(prepaidDays)
        let taxEscrowAmount = (max(annualPropertyTax, 0) / 12) * max(taxEscrowMonths, 0)
        let insuranceEscrowAmount = (max(annualInsurance, 0) / 12) * max(insuranceEscrowMonths, 0)
        let prepaidSubtotal = prepaidInterest + taxEscrowAmount + insuranceEscrowAmount
        let totalCredits = max(lenderCredit, 0) + max(sellerCredit, 0)
        let totalClosingCosts = lenderFees + thirdPartyFees + prepaidSubtotal - totalCredits

        return ClosingCostSummary(
            loanAmount: loanAmount,
            lenderFees: lenderFees,
            thirdPartyFees: thirdPartyFees,
            prepaidDays: prepaidDays,
            prepaidInterest: prepaidInterest,
            taxEscrowAmount: taxEscrowAmount,
            insuranceEscrowAmount: insuranceEscrowAmount,
            prepaidSubtotal: prepaidSubtotal,
            totalCredits: totalCredits,
            totalClosingCosts: totalClosingCosts
        )
    }

    static func purchaseTaxSummary(
        annualPropertyTax: Double,
        homePrice: Double,
        transferTaxRate: Double,
        recordingFee: Double
    ) -> PurchaseTaxSummary {
        let transferTax = max(homePrice, 0) * max(transferTaxRate, 0) / 100
        let total = max(annualPropertyTax, 0) + transferTax + max(recordingFee, 0)

        return PurchaseTaxSummary(
            annualPropertyTax: max(annualPropertyTax, 0),
            transferTax: transferTax,
            recordingFee: max(recordingFee, 0),
            estimatedTotalTaxFees: total
        )
    }

    static func investmentComparison(
        initialAmount: Double,
        monthlyContribution: Double,
        years: Double,
        expectedAnnualReturn: Double,
        mortgageRate: Double
    ) -> InvestmentComparisonSummary {
        let months = Int(max(years, 0) * 12)
        let expectedValue = futureValue(
            initialAmount: initialAmount,
            monthlyContribution: monthlyContribution,
            annualRate: expectedAnnualReturn,
            months: months
        )
        let mortgageBenchmarkValue = futureValue(
            initialAmount: initialAmount,
            monthlyContribution: monthlyContribution,
            annualRate: mortgageRate,
            months: months
        )
        let contributed = max(initialAmount, 0) + (max(monthlyContribution, 0) * Double(months))

        return InvestmentComparisonSummary(
            futureValueAtExpectedReturn: expectedValue,
            futureValueAtMortgageRate: mortgageBenchmarkValue,
            expectedGain: expectedValue - contributed,
            mortgageRateBenchmarkGain: mortgageBenchmarkValue - contributed,
            spread: expectedAnnualReturn - mortgageRate
        )
    }

    static func futureValue(
        initialAmount: Double,
        monthlyContribution: Double,
        annualRate: Double,
        months: Int
    ) -> Double {
        let safeInitialAmount = max(initialAmount, 0)
        let safeContribution = max(monthlyContribution, 0)
        let safeMonths = max(months, 0)
        let monthlyRate = annualRate / 100 / 12

        if monthlyRate == 0 {
            return safeInitialAmount + (safeContribution * Double(safeMonths))
        }

        let growth = pow(1 + monthlyRate, Double(safeMonths))
        let initialFutureValue = safeInitialAmount * growth
        let contributionFutureValue = safeContribution * ((growth - 1) / monthlyRate)
        return initialFutureValue + contributionFutureValue
    }
}
