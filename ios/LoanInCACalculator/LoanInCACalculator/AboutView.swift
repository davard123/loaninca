import SwiftUI

struct AboutView: View {
    @Environment(\.appLanguage) private var language

    var body: some View {
        List {
            Section {
                CalculatorIntro(
                    title: localized(language, zh: "全能贷款计算器", en: "All-in-One Loan Calculator"),
                    subtitle: localized(language, zh: "面向美国华人购房者的本地房贷预算助手。", en: "A local mortgage budgeting assistant for homebuyers in the United States."),
                    icon: "house.and.flag.fill",
                    accent: LoanInCATheme.brand
                )
            }

            Section(localized(language, zh: "关于 LoanInCA.com", en: "About LoanInCA.com")) {
                Text(localized(language, zh: "LoanInCA.com 全能贷款计算器把负担能力、每月持有成本、交割现金、重贷回本和投资房现金流串成一套清晰的购房决策路径。", en: "The LoanInCA.com all-in-one calculator brings affordability, monthly ownership cost, cash to close, refinance break-even, and rental cash flow into one clear homebuying path."))
            }

            Section(localized(language, zh: "隐私说明", en: "Privacy")) {
                Text(localized(language, zh: "房价、收入、债务和租金等计算内容只在你的设备上处理，不会发送给 LoanInCA.com。", en: "Home price, income, debt, rent, and other calculator entries are processed on your device and are not sent to LoanInCA.com."))
                Link(destination: URL(string: "https://www.loaninca.com/privacy")!) {
                    Label(localized(language, zh: "查看隐私政策", en: "View Privacy Policy"), systemImage: "lock.fill")
                }
            }

            Section(localized(language, zh: "免责声明", en: "Disclaimer")) {
                Text(localized(language, zh: "结果用于预算参考，不是贷款报价、审批承诺，也不是税务、法律或投资建议。实际条件取决于贷款机构、房屋、信用、收入、资产和市场。", en: "Results are budgeting references, not a loan quote, approval commitment, or tax, legal, or investment advice. Actual terms depend on the lender, property, credit, income, assets, and market."))
            }

            Section(localized(language, zh: "数据来源与更新时间", en: "Data Sources and Updates")) {
                ResultRow(localized(language, zh: "计算公式", en: "Calculation formulas"), value: localized(language, zh: "标准摊还公式与简化预算假设", en: "Standard amortization and simplified assumptions"))
                ResultRow(localized(language, zh: "资讯来源", en: "Insights sources"), value: localized(language, zh: "公开市场与政策资料", en: "Public market and policy references"))
                ResultRow(localized(language, zh: "资讯更新时间", en: "Insights updated"), value: localized(language, zh: "见资讯页", en: "Shown in Insights"))
            }

            Section(localized(language, zh: "联系支持", en: "Contact Support")) {
                Link(destination: URL(string: "mailto:lodaviddai@gmail.com")!) {
                    Label("lodaviddai@gmail.com", systemImage: "envelope.fill")
                }
                Link(destination: URL(string: "tel:9496561278")!) {
                    Label("949-656-1278", systemImage: "phone.fill")
                }
                Link(destination: URL(string: "https://www.loaninca.com")!) {
                    Label("loaninca.com", systemImage: "globe")
                }
            }

            Section(localized(language, zh: "语言支持", en: "Languages")) {
                Text(localized(language, zh: "简体中文和英文", en: "Simplified Chinese and English"))
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.brand)
        .navigationTitle(localized(language, zh: "关于", en: "About"))
    }
}

#Preview {
    NavigationStack {
        AboutView()
            .environment(\.appLanguage, .zhHans)
    }
}
