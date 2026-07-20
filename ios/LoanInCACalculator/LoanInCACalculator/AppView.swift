import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case home
    case plans
    case news
    case settings

    var id: String { rawValue }

    func title(for language: AppLanguage) -> String {
        switch self {
        case .home: return localized(language, zh: "首页", en: "Home")
        case .plans: return localized(language, zh: "方案", en: "Plans")
        case .news: return localized(language, zh: "资讯", en: "Insights")
        case .settings: return localized(language, zh: "设置", en: "Settings")
        }
    }

    var systemImage: String {
        switch self {
        case .home: return "house.fill"
        case .plans: return "folder.fill"
        case .news: return "newspaper.fill"
        case .settings: return "gearshape.fill"
        }
    }
}

enum AppRoute: Hashable {
    case purchase
    case refinance
    case income
    case closingCost
    case investment
    case about
}

struct AppView: View {
    @State private var selectedTab: AppTab = .home
    @StateObject private var savedPlans = SavedPlansStore()
    @AppStorage("appLanguage") private var appLanguageRawValue = AppLanguage.zhHans.rawValue

    private var language: AppLanguage {
        AppLanguage(rawValue: appLanguageRawValue) ?? .zhHans
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
                    .navigationDestination(for: AppRoute.self, destination: destination)
            }
            .tabItem { Label(AppTab.home.title(for: language), systemImage: AppTab.home.systemImage) }
            .tag(AppTab.home)

            NavigationStack {
                PlansView()
                    .navigationDestination(for: AppRoute.self, destination: destination)
            }
            .tabItem { Label(AppTab.plans.title(for: language), systemImage: AppTab.plans.systemImage) }
            .tag(AppTab.plans)

            NavigationStack {
                PolicyNewsView()
            }
            .tabItem { Label(AppTab.news.title(for: language), systemImage: AppTab.news.systemImage) }
            .tag(AppTab.news)

            NavigationStack {
                SettingsView(appLanguageRawValue: $appLanguageRawValue)
                    .navigationDestination(for: AppRoute.self, destination: destination)
            }
            .tabItem { Label(AppTab.settings.title(for: language), systemImage: AppTab.settings.systemImage) }
            .tag(AppTab.settings)
        }
        .environment(\.appLanguage, language)
        .environmentObject(savedPlans)
        .tint(Color("AccentColor"))
    }

    @ViewBuilder
    private func destination(for route: AppRoute) -> some View {
        switch route {
        case .purchase:
            PurchaseCalculatorView()
        case .refinance:
            RefinanceCalculatorView()
        case .income:
            IncomeCalculatorView()
        case .closingCost:
            ClosingCostCalculatorView()
        case .investment:
            InvestmentComparisonView()
        case .about:
            AboutView()
        }
    }
}

private struct HomeView: View {
    @Environment(\.appLanguage) private var language

    @State private var homePrice: Double = 750_000
    @State private var downPayment: Double = 150_000
    @State private var interestRate: Double = 6.5
    @State private var loanTerm = 30

    private let loanTerms = [15, 20, 25, 30]

    private var loanAmount: Double {
        max(homePrice - min(max(downPayment, 0), max(homePrice, 0)), 0)
    }

    private var monthlyPrincipalInterest: Double {
        CalculatorEngine.mortgagePayment(
            principal: loanAmount,
            annualRate: max(interestRate, 0),
            years: loanTerm
        )
    }

    private var tasks: [HomeTask] {
        [
            HomeTask(
                step: "01",
                title: localized(language, zh: "我能买多少钱？", en: "How much can I afford?"),
                subtitle: localized(language, zh: "用收入和月供目标开始估算", en: "Start with income and payment targets"),
                status: localized(language, zh: "待补充收入与负债", en: "Add income and debts"),
                icon: "gauge.with.dots.needle.bottom.50percent",
                accent: LoanInCATheme.action,
                route: .income
            ),
            HomeTask(
                step: "02",
                title: localized(language, zh: "这套房每月实际要付多少？", en: "What is the real monthly payment?"),
                subtitle: localized(language, zh: "拆分贷款、本金利息、税费、保险和 HOA", en: "Break down loan, tax, insurance, PMI, and HOA"),
                status: localized(language, zh: "当前 P&I \(LoanFormatter.currencyRoundedString(monthlyPrincipalInterest)) / 月", en: "Current P&I \(LoanFormatter.currencyRoundedString(monthlyPrincipalInterest)) / mo"),
                icon: "house.and.flag.fill",
                accent: LoanInCATheme.brand,
                route: .purchase
            ),
            HomeTask(
                step: "03",
                title: localized(language, zh: "Closing 要准备多少钱？", en: "How much cash for closing?"),
                subtitle: localized(language, zh: "估算交割费用、预付项和抵扣", en: "Estimate fees, prepaids, and credits"),
                status: localized(language, zh: "费用起点约 \(LoanFormatter.currencyRoundedString(max(homePrice, 0) * 0.025))", en: "Starting cost estimate \(LoanFormatter.currencyRoundedString(max(homePrice, 0) * 0.025))"),
                icon: "checklist.checked",
                accent: LoanInCATheme.warning,
                route: .closingCost
            ),
            HomeTask(
                step: "04",
                title: localized(language, zh: "重贷是否划算？", en: "Is refinancing worth it?"),
                subtitle: localized(language, zh: "比较新旧月供和回本时间", en: "Compare payment change and break-even"),
                status: localized(language, zh: "比较利率、费用与持有时间", en: "Compare rates, costs, and hold time"),
                icon: "arrow.triangle.2.circlepath",
                accent: LoanInCATheme.refinance,
                route: .refinance
            ),
            HomeTask(
                step: "05",
                title: localized(language, zh: "投资房现金流如何？", en: "How is the rental cash flow?"),
                subtitle: localized(language, zh: "查看 DSCR 与现金流压力", en: "Review DSCR and monthly pressure"),
                status: localized(language, zh: "查看 DSCR 与每月净现金流", en: "Review DSCR and net monthly cash flow"),
                icon: "chart.line.uptrend.xyaxis",
                accent: LoanInCATheme.investment,
                route: .investment
            )
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(localized(language, zh: "今天先算哪一步？", en: "What do you want to calculate?"))
                        .font(.title2.bold())
                        .dynamicTypeSize(.xSmall ... .accessibility2)
                    Text(localized(language, zh: "输入数字，结果会立即更新。", en: "Enter your numbers and see the estimate update instantly."))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 8) {
                        Label(localized(language, zh: "快速固定利率月供", en: "Quick Fixed-Rate Payment"), systemImage: "bolt.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.9))
                        Text(LoanFormatter.currencyRoundedString(monthlyPrincipalInterest))
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                            .allowsTightening(true)
                            .layoutPriority(1)
                        Text(localized(language, zh: "每月本金和利息", en: "Principal and interest per month"))
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.78))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                    .background(LoanInCATheme.brand)
                    .dynamicTypeSize(.xSmall ... .accessibility2)

                    VStack(spacing: 14) {
                        LabeledNumberField(localized(language, zh: "房价", en: "Home price"), value: $homePrice, accent: LoanInCATheme.brand)
                        LabeledNumberField(localized(language, zh: "首付", en: "Down payment"), value: $downPayment, accent: LoanInCATheme.brand)

                        HStack(spacing: 8) {
                            Text(localized(language, zh: "首付快捷", en: "Down payment"))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                            Spacer()
                            ForEach([5, 10, 20], id: \.self) { percent in
                                Button("\(percent)%") {
                                    downPayment = max(homePrice, 0) * Double(percent) / 100
                                }
                                .font(.caption.weight(.bold))
                                .buttonStyle(.bordered)
                                .buttonBorderShape(.capsule)
                                .tint(LoanInCATheme.brand)
                            }
                        }

                        LabeledNumberField(localized(language, zh: "利率 (%)", en: "Interest rate (%)"), value: $interestRate, accent: LoanInCATheme.brand)

                        VStack(alignment: .leading, spacing: 8) {
                            Label(localized(language, zh: "贷款期限", en: "Loan term"), systemImage: "calendar")
                                .font(.subheadline.weight(.semibold))
                            Picker(localized(language, zh: "贷款期限", en: "Loan term"), selection: $loanTerm) {
                                ForEach(loanTerms, id: \.self) { term in
                                    Text(localized(language, zh: "\(term) 年", en: "\(term)y")).tag(term)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        NavigationLink(value: AppRoute.purchase) {
                            HStack {
                                Text(localized(language, zh: "查看含税费的完整月供", en: "See the complete payment"))
                                    .font(.subheadline.weight(.semibold))
                                Spacer()
                                Image(systemName: "arrow.right")
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16)
                            .frame(minHeight: 50)
                            .background(LoanInCATheme.action, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(18)
                    .background(LoanInCATheme.surface)
                }
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(LoanInCATheme.brand.opacity(0.22), lineWidth: 1)
                }

                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(localized(language, zh: "购房决策路径", en: "Homebuying decision path"))
                            .font(.title3.bold())
                        Text(localized(language, zh: "每一步都对应一个可计算的决定", en: "Each step resolves one financial decision"))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("1 / 5")
                        .font(.caption.monospacedDigit().weight(.bold))
                        .foregroundStyle(LoanInCATheme.brand)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(LoanInCATheme.brand.opacity(0.10), in: Capsule())
                }

                VStack(spacing: 12) {
                    ForEach(tasks) { task in
                        NavigationLink(value: task.route) {
                            HStack(alignment: .top, spacing: 14) {
                                VStack(spacing: 8) {
                                    Text(task.step)
                                        .font(.caption.monospacedDigit().weight(.black))
                                        .foregroundStyle(.white)
                                        .frame(width: 38, height: 38)
                                        .background(task.accent, in: Circle())
                                    Image(systemName: task.icon)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(task.accent)
                                }

                                VStack(alignment: .leading, spacing: 6) {
                                    Text(task.title)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.primary)
                                    Text(task.subtitle)
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                    HStack(spacing: 6) {
                                        Circle()
                                            .fill(task.accent)
                                            .frame(width: 6, height: 6)
                                        Text(task.status)
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(task.accent)
                                            .lineLimit(2)
                                    }
                                    .padding(.top, 3)
                                }

                                Spacer(minLength: 4)
                                Image(systemName: "chevron.right")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(task.accent)
                                    .frame(minHeight: 44)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(LoanInCATheme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(task.accent)
                                    .frame(width: 4)
                                    .padding(.vertical, 12)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(Text(task.title))
                        .accessibilityHint(Text(task.subtitle))
                    }
                }
            }
            .frame(maxWidth: 760)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(LoanInCATheme.groupedBackground)
        .navigationTitle(localized(language, zh: "全能贷款计算器", en: "All-in-One Loan Calculator"))
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct PlansView: View {
    @Environment(\.appLanguage) private var language
    @EnvironmentObject private var savedPlans: SavedPlansStore

    var body: some View {
        List {
            if !savedPlans.plans.isEmpty {
                Section(localized(language, zh: "已保存方案", en: "Saved Plans")) {
                    ForEach(savedPlans.plans) { plan in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(plan.name)
                                    .font(.headline)
                                Spacer()
                                ShareLink(item: plan.shareText) {
                                    Label(localized(language, zh: "分享", en: "Share"), systemImage: "square.and.arrow.up")
                                        .labelStyle(.iconOnly)
                                }
                                .accessibilityLabel(Text(localized(language, zh: "分享方案", en: "Share plan")))
                            }
                            Text(plan.headline)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            HStack {
                                if let monthlyPayment = plan.monthlyPayment {
                                    PlanMetric(label: localized(language, zh: "月供", en: "Monthly"), value: LoanFormatter.currencyRoundedString(monthlyPayment))
                                }
                                if let loanAmount = plan.loanAmount {
                                    PlanMetric(label: localized(language, zh: "贷款", en: "Loan"), value: LoanFormatter.currencyRoundedString(loanAmount))
                                }
                                if let cashToClose = plan.cashToClose {
                                    PlanMetric(label: localized(language, zh: "现金", en: "Cash"), value: LoanFormatter.currencyRoundedString(cashToClose))
                                }
                            }
                        }
                        .padding(.vertical, 6)
                    }
                    .onDelete(perform: savedPlans.delete)
                }

                if savedPlans.plans.count >= 2 {
                    Section(localized(language, zh: "快速对比", en: "Quick Compare")) {
                        PlanComparisonRow(first: savedPlans.plans[0], second: savedPlans.plans[1], language: language)
                    }
                }
            }

            Section(localized(language, zh: "工具", en: "Tools")) {
                ToolLink(title: localized(language, zh: "买房月供", en: "Purchase Payment"), icon: "house.fill", route: .purchase)
                ToolLink(title: localized(language, zh: "重贷分析", en: "Refinance Analysis"), icon: "arrow.triangle.2.circlepath", route: .refinance)
                ToolLink(title: localized(language, zh: "收入估算", en: "Income Estimate"), icon: "chart.bar.xaxis", route: .income)
                ToolLink(title: localized(language, zh: "Closing 费用", en: "Closing Costs"), icon: "list.clipboard.fill", route: .closingCost)
                ToolLink(title: localized(language, zh: "现金策略", en: "Cash Strategy"), icon: "chart.line.uptrend.xyaxis", route: .investment)
            }

            if savedPlans.plans.isEmpty {
                Section {
                ContentUnavailableView(
                    localized(language, zh: "还没有保存方案", en: "No saved plans yet"),
                    systemImage: "folder.badge.plus",
                    description: Text(localized(language, zh: "在买房月供结果中保存方案后，可在这里对比和分享。", en: "Save a purchase result to compare and share it here."))
                )
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(LoanInCATheme.groupedBackground)
        .tint(LoanInCATheme.brand)
        .navigationTitle(localized(language, zh: "方案", en: "Plans"))
    }
}

private struct SettingsView: View {
    @Environment(\.appLanguage) private var language
    @Binding var appLanguageRawValue: String

    var body: some View {
        List {
            Section(localized(language, zh: "语言", en: "Language")) {
                Picker(localized(language, zh: "应用语言", en: "App Language"), selection: $appLanguageRawValue) {
                    ForEach(AppLanguage.allCases) { language in
                        Text(language.displayName).tag(language.rawValue)
                    }
                }
            }

            Section(localized(language, zh: "支持", en: "Support")) {
                NavigationLink(value: AppRoute.about) {
                    Label(localized(language, zh: "关于 LoanInCA.com", en: "About LoanInCA.com"), systemImage: "info.circle.fill")
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(LoanInCATheme.groupedBackground)
        .tint(LoanInCATheme.brand)
        .navigationTitle(localized(language, zh: "设置", en: "Settings"))
    }
}

private struct ToolLink: View {
    let title: String
    let icon: String
    let route: AppRoute

    var body: some View {
        NavigationLink(value: route) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundStyle(accent)
                    .frame(width: 28, height: 28)
                    .background(accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                Text(title)
            }
        }
        .accessibilityLabel(Text(title))
    }

    private var accent: Color {
        switch route {
        case .purchase: return LoanInCATheme.brand
        case .refinance: return LoanInCATheme.refinance
        case .income: return LoanInCATheme.action
        case .closingCost: return LoanInCATheme.warning
        case .investment: return LoanInCATheme.investment
        case .about: return LoanInCATheme.brand
        }
    }
}

private struct HomeTask: Identifiable {
    let id = UUID()
    let step: String
    let title: String
    let subtitle: String
    let status: String
    let icon: String
    let accent: Color
    let route: AppRoute
}

private struct PlanMetric: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .allowsTightening(true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct PlanComparisonRow: View {
    let first: SavedPlan
    let second: SavedPlan
    let language: AppLanguage

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(first.name) / \(second.name)")
                .font(.headline)
            comparisonLine(localized(language, zh: "月供差", en: "Monthly Difference"), first.monthlyPayment, second.monthlyPayment)
            comparisonLine(localized(language, zh: "贷款差", en: "Loan Difference"), first.loanAmount, second.loanAmount)
            comparisonLine(localized(language, zh: "现金差", en: "Cash Difference"), first.cashToClose, second.cashToClose)
            Text(localized(language, zh: "对比只显示已保存字段，实际选择仍需结合利率、费用、持有周期和贷款机构审核。", en: "Comparison only uses saved fields. Actual decisions still depend on rates, costs, holding period, and lender review."))
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func comparisonLine(_ title: String, _ firstValue: Double?, _ secondValue: Double?) -> some View {
        if let firstValue, let secondValue {
            ResultRow(title, value: LoanFormatter.currencyString(firstValue - secondValue))
        }
    }
}

#Preview {
    AppView()
}
