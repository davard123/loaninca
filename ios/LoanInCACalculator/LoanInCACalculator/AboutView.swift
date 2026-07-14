import SwiftUI

struct AboutView: View {
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Text("LoanInCA Calculator")
                        .font(.title2.bold())
                    Text("这是把 `calculator.html` 原生迁移到 iOS 的第一版。")
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }

            Section("当前已经迁移") {
                Text("Buy / Sell 月供计算")
                Text("等额本息 / 等额本金对比")
                Text("Refinance 重贷对比")
                Text("Income 收入估算")
                Text("Closing Cost 过户费拆分")
                Text("购房税费速算")
                Text("理财收益对比")
                Text("政策资讯展示")
            }

            Section("后续建议") {
                Text("把 FHA 州县限额数据拆到 JSON 资源文件")
                Text("把 VA 区域规则做成独立服务")
                Text("增加本地持久化和分享导出")
                Text("补充单元测试与模拟器验收")
            }

            Section("来源") {
                Text("原始网页: loaninca-repo/calculator.html")
                Text("迁移策略: 保留核心公式，先做轻量原生 MVP，再继续补齐大数据模块。")
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("关于")
    }
}

#Preview {
    NavigationStack {
        AboutView()
    }
}
