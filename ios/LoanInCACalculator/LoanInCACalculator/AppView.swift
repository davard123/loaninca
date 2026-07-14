import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case purchase
    case refinance
    case income
    case closingCost
    case investment
    case news
    case about

    var id: String { rawValue }

    var title: String {
        switch self {
        case .purchase: return "买房"
        case .refinance: return "重贷"
        case .income: return "收入"
        case .closingCost: return "过户费"
        case .investment: return "理财"
        case .news: return "资讯"
        case .about: return "关于"
        }
    }

    var systemImage: String {
        switch self {
        case .purchase: return "house.fill"
        case .refinance: return "arrow.triangle.2.circlepath"
        case .income: return "chart.bar.xaxis"
        case .closingCost: return "list.clipboard.fill"
        case .investment: return "chart.line.uptrend.xyaxis"
        case .news: return "newspaper.fill"
        case .about: return "info.circle.fill"
        }
    }
}

struct AppView: View {
    @State private var selectedTab: AppTab = .purchase

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                PurchaseCalculatorView()
            }
            .tabItem { Label(AppTab.purchase.title, systemImage: AppTab.purchase.systemImage) }
            .tag(AppTab.purchase)

            NavigationStack {
                RefinanceCalculatorView()
            }
            .tabItem { Label(AppTab.refinance.title, systemImage: AppTab.refinance.systemImage) }
            .tag(AppTab.refinance)

            NavigationStack {
                IncomeCalculatorView()
            }
            .tabItem { Label(AppTab.income.title, systemImage: AppTab.income.systemImage) }
            .tag(AppTab.income)

            NavigationStack {
                ClosingCostCalculatorView()
            }
            .tabItem { Label(AppTab.closingCost.title, systemImage: AppTab.closingCost.systemImage) }
            .tag(AppTab.closingCost)

            NavigationStack {
                InvestmentComparisonView()
            }
            .tabItem { Label(AppTab.investment.title, systemImage: AppTab.investment.systemImage) }
            .tag(AppTab.investment)

            NavigationStack {
                PolicyNewsView()
            }
            .tabItem { Label(AppTab.news.title, systemImage: AppTab.news.systemImage) }
            .tag(AppTab.news)

            NavigationStack {
                AboutView()
            }
            .tabItem { Label(AppTab.about.title, systemImage: AppTab.about.systemImage) }
            .tag(AppTab.about)
        }
        .tint(Color("AccentColor"))
    }
}

#Preview {
    AppView()
}
