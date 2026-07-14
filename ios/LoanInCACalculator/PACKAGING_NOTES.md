# Packaging Notes

This folder is intended to be copied as a self-contained handoff package to a Mac.

## What to bring to the Mac

Copy the entire folder:

- `ios/LoanInCACalculator`

That folder already includes:

- Native SwiftUI project: `LoanInCACalculator.xcodeproj`
- Native source files under `LoanInCACalculator/`
- Local news snapshot used by the app
- Web source references under `SourceReference/`

## Source reference files included

- `SourceReference/original-calculator.html`
- `SourceReference/web-mortgage-news.json`

These are included so you can:

- compare native results with the original web logic
- recover formulas if you want to port more modules
- inspect the original field structure and naming

## Open on Mac

1. Install Xcode
2. Open `LoanInCACalculator.xcodeproj`
3. Select the `LoanInCACalculator` scheme
4. Run on an iPhone simulator

## Likely next steps on Mac

- verify the project loads without Xcode project warnings
- run the app on simulator
- set your Apple team / signing if needed
- add app icon assets
- continue porting FHA / VA data lookups if desired
