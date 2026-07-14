# Source Mapping

This file maps the original web calculator logic to the new SwiftUI app.

## Original web source

- Main source: `SourceReference/original-calculator.html`
- News data: `SourceReference/web-mortgage-news.json`

## Mapping

- `formatCurrency(...)`
  - Native: `LoanInCACalculator/Formatting.swift`

- `calculateMortgagePayment(...)`
  - Native: `LoanInCACalculator/CalculatorEngine.swift`

- Buy / Sell submit logic
  - Web area: `buy-sell-form` submit handler
  - Native: `LoanInCACalculator/PurchaseCalculatorView.swift`
  - Shared logic: `LoanInCACalculator/CalculatorEngine.swift`

- Refinance submit logic
  - Web area: `refinance-form` submit handler
  - Native: `LoanInCACalculator/RefinanceCalculatorView.swift`
  - Shared logic: `LoanInCACalculator/CalculatorEngine.swift`

- Income submit logic
  - Web area: `income-form` submit handler
  - Native: `LoanInCACalculator/IncomeCalculatorView.swift`
  - Shared logic: `LoanInCACalculator/CalculatorEngine.swift`

- Closing cost submit logic
  - Web area: `closing-cost-form` submit handler
  - Native: `LoanInCACalculator/ClosingCostCalculatorView.swift`
  - Shared logic: `LoanInCACalculator/CalculatorEngine.swift`

- `getClosingMonthEndDays(...)`
  - Native: `LoanInCACalculator/CalculatorEngine.swift`

- New native-only additions
  - equal payment vs equal principal comparison:
    `LoanInCACalculator/CalculatorEngine.swift`
  - purchase tax helper:
    `LoanInCACalculator/CalculatorEngine.swift`
  - investment comparison:
    `LoanInCACalculator/InvestmentComparisonView.swift`
  - policy/news page:
    `LoanInCACalculator/PolicyNewsView.swift`

## Not fully ported yet

- full FHA county loan-limit dataset
- full VA regional eligibility detail module
- all dynamic multi-entry web form behaviors
- multilingual switching from the web page

## Why the reference copy is useful

If a native result looks off, you can compare it against:

1. the web field names
2. the original formulas
3. the original assumptions embedded in the submit handlers
