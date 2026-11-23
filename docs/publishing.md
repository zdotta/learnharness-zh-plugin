# 发布到社区（LearnHarness 没有插件市场）

LearnHarness 官方**没有**插件市场、插件注册表或自动更新（`docs/plugin-authoring.md` 的
"Deliberate limits" 明确写了 *No marketplace/community updater*）。所谓"发布到社区"由三件事组成：

1. 一个公开的 GitHub 仓库 + Release（用户手动下载/克隆）
2. 进入社区索引 [awesome-learnharness](https://github.com/tn-lorenz/awesome-learnharness)
3. 在官方 GitHub Discussions / Discord 公告

## 发布状态（2026-11-24）

| 渠道 | 链接 / 状态 |
| --- | --- |
| GitHub 仓库（PUBLIC） | https://github.com/zdotta/learnharness-zh-plugin |
| Release v0.3.0 | https://github.com/zdotta/learnharness-zh-plugin/releases/tag/v0.3.0 |
| awesome-learnharness PR | https://github.com/tn-lorenz/awesome-learnharness/pull/5 （OPEN） |
| 官方 Discussions · Show and tell | https://github.com/amosblomqvist/learnharness/discussions/920 |
| Discord 公告 | 待手动发布（无 API） |

## 当前发布配置

| 项 | 值 |
| --- | --- |
| 插件 ID | `zh-cn-language-pack-plus`（与 jieye666/learnharness-zh-cn 的 `zh-cn-language-pack` 区分） |
| 显示名 | 简体中文语言包 |
| 版本 | 0.3.0 |
| 许可 | MIT（词表含 jieye666 的 MIT 贡献，见 `THIRD-PARTY.md`） |
| 仓库 | https://github.com/zdotta/learnharness-zh-plugin |
| Release 资产 | `release/zh-cn-language-pack-plus-0.3.0.zip` |

## 1. 公开仓库 + Release

```powershell
gh repo edit zdotta/learnharness-zh-plugin --visibility public --accept-visibility-change-consequences
gh release create v0.3.0 release/zh-cn-language-pack-plus-0.3.0.zip --title "v0.3.0" --notes "See README"
```

## 2. awesome-learnharness PR

在 [README.md](https://github.com/tn-lorenz/awesome-learnharness/blob/main/README.md) 的 Plugins 表追加：

```markdown
| [learnharness-zh-cn-language-pack-plus](https://github.com/zdotta/learnharness-zh-plugin) | [zdotta](https://github.com/zdotta) | Simplified Chinese UI (DOM translation) + Chinese teaching instructions, in-app coverage report and content protection. MIT | n.a. |
```

## 3. GitHub Discussions（Show and tell）

仓库已开启 Discussions（Announcements / General / Ideas / Polls / Q&A / **Show and tell**）：
<https://github.com/amosblomqvist/learnharness/discussions>

帖子草稿：

> **简体中文语言包 Plus（社区插件）— Simplified Chinese language pack**
>
> A community plugin that turns the LearnHarness UI into Simplified Chinese and adds Chinese
> teaching instructions for teacher/prober/practice. It is a DOM-layer transitional solution
> (0.6.x/0.7.0 have no i18n API), with an in-app coverage report and content protection for
> prose, inputs, model output, code and formulas.
>
> - Repo: https://github.com/zdotta/learnharness-zh-plugin
> - Tested on 0.7.0 (minAppVersion 0.6.1); 30 unit tests + M1/M2 integration acceptance
> - Dictionary: 1,373 entries (core i18n + MIT community dictionary) and 109 rules
> - Install: copy `dist/` to `<learning data>/plugins/zh-cn-language-pack-plus/dist`, refresh, enable
> - Known limits: first-paint flash; Electron native chrome not covered
>
> Feedback on missing strings is welcome — the plugin exports an untranslated JSON report.

## 4. Discord

<https://discord.gg/5tCHHQEB2e> — 简短介绍 + 仓库链接 + 截图。

## 5. 维护节奏

- 每次上游大版本：跑 `node tests/integration/scan-settings.mjs` 与 `scan.mjs`，把新漏词补进
  `src/dictionary.extra.ts`（或上游词典）。
- 更新 `manifest.version` 与 `minAppVersion`，重新打 Release。
- 上游核心 i18n（PR #818）合并后，本插件检测到 `html lang=zh` 会自动停用。
