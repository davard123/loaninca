import SwiftUI

enum AppLanguage: String, CaseIterable, Identifiable {
    case zhHans
    case en

    var id: String { rawValue }

    var buttonTitle: String {
        switch self {
        case .zhHans: return "中文"
        case .en: return "EN"
        }
    }

    var displayName: String {
        switch self {
        case .zhHans: return "简体中文"
        case .en: return "English"
        }
    }
}

private struct AppLanguageKey: EnvironmentKey {
    static let defaultValue = AppLanguage.zhHans
}

extension EnvironmentValues {
    var appLanguage: AppLanguage {
        get { self[AppLanguageKey.self] }
        set { self[AppLanguageKey.self] = newValue }
    }
}

func localized(_ language: AppLanguage, zh: String, en: String) -> String {
    switch language {
    case .zhHans:
        return zh
    case .en:
        return en
    }
}
