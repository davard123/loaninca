import SwiftUI

struct PolicyNewsView: View {
    @Environment(\.appLanguage) private var language
    @State private var feed = PolicyNewsLoader.loadInitial()
    @State private var statusText = ""
    @State private var isRefreshing = false

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    CalculatorIntro(
                        title: localized(language, zh: "房贷政策资讯", en: "Mortgage Insights"),
                        subtitle: localized(language, zh: "公开市场与政策资料，按来源和日期整理。", en: "Public market and policy references organized by source and date."),
                        icon: "newspaper.fill",
                        accent: LoanInCATheme.refinance
                    )
                    if !feed.generatedAt.isEmpty {
                        Text(localized(language, zh: "最近内容：\(feed.items.first?.date ?? "")", en: "Latest item: \(feed.items.first?.date ?? "")"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if !statusText.isEmpty {
                        Text(statusText)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            ForEach(feed.items) { item in
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(item.source)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.thinMaterial, in: Capsule())
                            Spacer()
                            Text(item.date)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Text(item.localizedTitle(for: language))
                            .font(.headline)

                        Text(item.localizedSummary(for: language))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if let url = URL(string: item.url) {
                            Link(localized(language, zh: "查看来源", en: "View Source"), destination: url)
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .calculatorFormStyle(accent: LoanInCATheme.refinance)
        .navigationTitle(localized(language, zh: "资讯", en: "Insights"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await refresh(force: true) }
                } label: {
                    if isRefreshing {
                        ProgressView()
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                .disabled(isRefreshing)
                .accessibilityLabel(Text(localized(language, zh: "刷新资讯", en: "Refresh insights")))
            }
        }
        .refreshable {
            await refresh(force: true)
        }
        .task {
            await refresh(force: false)
        }
    }

    @MainActor
    private func refresh(force: Bool) async {
        guard !isRefreshing else { return }
        isRefreshing = true
        let update = await PolicyNewsLoader.loadRemoteWithFallback(force: force)
        feed = update.feed
        statusText = localized(language, zh: update.zhStatus, en: update.enStatus)
        isRefreshing = false
    }
}

enum PolicyNewsLoader {
    private static let cacheKey = "policyNewsFeed.cache.v1"
    private static let lastRefreshKey = "policyNewsFeed.lastRefresh.v1"
    private static let refreshInterval: TimeInterval = 7 * 24 * 60 * 60
    private static let remoteURL = URL(string: "https://www.loaninca.com/assets/mortgage-news.json")!

    struct FeedUpdate {
        let feed: PolicyNewsFeed
        let zhStatus: String
        let enStatus: String
    }

    static func loadInitial() -> PolicyNewsFeed {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cached = try? JSONDecoder().decode(PolicyNewsFeed.self, from: data) {
            return cached
        }
        return loadBundled()
    }

    private static func loadBundled() -> PolicyNewsFeed {
        guard
            let url = Bundle.main.url(forResource: "mortgage-news", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let feed = try? JSONDecoder().decode(PolicyNewsFeed.self, from: data)
        else {
            return PolicyNewsFeed(generatedAt: "", notes: "", items: [])
        }

        return feed
    }

    static func loadRemoteWithFallback(force: Bool) async -> FeedUpdate {
        if !force,
           let lastRefresh = UserDefaults.standard.object(forKey: lastRefreshKey) as? Date,
           Date().timeIntervalSince(lastRefresh) < refreshInterval {
            let feed = loadInitial()
            return FeedUpdate(
                feed: feed,
                zhStatus: "更新于 \(displayDate(feed.generatedAt, languageCode: "zh"))",
                enStatus: "Updated \(displayDate(feed.generatedAt, languageCode: "en"))"
            )
        }

        do {
            let (data, response) = try await URLSession.shared.data(from: remoteURL)
            guard let httpResponse = response as? HTTPURLResponse,
                  200..<300 ~= httpResponse.statusCode else {
                throw URLError(.badServerResponse)
            }
            let feed = try JSONDecoder().decode(PolicyNewsFeed.self, from: data)
            UserDefaults.standard.set(data, forKey: cacheKey)
            UserDefaults.standard.set(Date(), forKey: lastRefreshKey)
            return FeedUpdate(
                feed: feed,
                zhStatus: "更新于 \(displayDate(feed.generatedAt, languageCode: "zh"))",
                enStatus: "Updated \(displayDate(feed.generatedAt, languageCode: "en"))"
            )
        } catch {
            let feed = loadInitial()
            return FeedUpdate(
                feed: feed,
                zhStatus: "暂时无法更新，最近内容更新于 \(displayDate(feed.generatedAt, languageCode: "zh"))",
                enStatus: "Unable to refresh. Latest available update: \(displayDate(feed.generatedAt, languageCode: "en"))"
            )
        }
    }

    private static func displayDate(_ value: String, languageCode: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: value) else { return value }
        return date.formatted(
            Date.FormatStyle(date: .abbreviated, time: .omitted)
                .locale(Locale(identifier: languageCode == "zh" ? "zh_Hans" : "en_US"))
        )
    }
}

#Preview {
    NavigationStack {
        PolicyNewsView()
            .environment(\.appLanguage, .zhHans)
    }
}
