# LoanInCA Calculator iOS

This folder contains a first native SwiftUI migration of `calculator.html`.

Included in v1:
- Purchase / Buy-Sell calculator
- Equal-payment vs equal-principal comparison
- Refinance calculator
- Income calculator
- Closing cost calculator
- Purchase tax quick estimate
- Investment return comparison
- Mortgage policy/news feed
- Native tab navigation and shared calculation engine

Notes:
- The large FHA / VA regional lookup tables from the web page are not yet fully ported into the native build.
- The app is organized so those datasets can be added later without rewriting the UI.

Open `LoanInCACalculator.xcodeproj` in Xcode and run the `LoanInCACalculator` scheme on an iPhone simulator.

Reference files for migration and debugging are also included:

- `SourceReference/original-calculator.html`
- `SourceReference/web-mortgage-news.json`
- `SOURCE_MAPPING.md`
- `PACKAGING_NOTES.md`
