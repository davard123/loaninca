import SwiftUI

struct PolicyNewsView: View {
    @State private var feed = PolicyNewsLoader.load()

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("房贷政策资讯")
                        .font(.title3.bold())
                    Text("当前展示的是随 App 打包的本地资讯快照，后续可以替换成远程 API 或直接复用网站的 JSON 更新流程。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    if !feed.generatedAt.isEmpty {
                        Text("Snapshot: \(feed.generatedAt)")
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

                        Text(item.title)
                            .font(.headline)

                        Text(item.summary)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if let url = URL(string: item.url) {
                            Link("查看原文", destination: url)
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("资讯")
    }
}

enum PolicyNewsLoader {
    static func load() -> PolicyNewsFeed {
        guard
            let url = Bundle.main.url(forResource: "mortgage-news", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let feed = try? JSONDecoder().decode(PolicyNewsFeed.self, from: data)
        else {
            return PolicyNewsFeed(generatedAt: "", notes: "", items: [])
        }

        return feed
    }
}

#Preview {
    NavigationStack {
        PolicyNewsView()
    }
}
