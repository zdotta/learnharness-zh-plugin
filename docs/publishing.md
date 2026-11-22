# 发布到社区（LearnHarness 没有插件市场）

LearnHarness 官方**没有**插件市场、插件注册表或自动更新（`docs/plugin-authoring.md` 的
"Deliberate limits" 明确写了 *No marketplace/community updater*）。所谓"发布到社区"由三件事组成：

1. 一个公开的 GitHub 仓库 + Release（用户手动下载/克隆）
2. 进入社区索引 [awesome-learnharness](https://github.com/tn-lorenz/awesome-learnharness)
3. 在官方 GitHub Discussions / Discord 公告

## 0. 发布前必须确认

| 项 | 现状 | 说明 |
| --- | --- | --- |
| 插件 ID | `zh-cn-language-pack` | **与 jieye666/learnharness-zh-cn 完全同名**，两者不能共存（同一目录）。公开前建议改名，例如 `zh-cn-language-pack-plus`，或与作者合并词表 |
| 许可证 | AGPL-3.0-only（已补 LICENSE） | 若要宽松分发可改 MIT，但需所有者决定 |
| 仓库可见性 | PRIVATE | 公开：`gh repo edit zdotta/learnharness-zh-plugin --visibility public --accept-visibility-change-consequences` |
| Release 资产 | `release/zh-cn-language-pack-0.2.0.zip` | 用 `gh release create v0.2.0 release/zh-cn-language-pack-0.2.0.zip` |
| 安全声明 | README 已写 | 插件是可信本地代码、不沙箱，安装即执行 |

## 1. awesome-learnharness PR

在 [README.md](https://github.com/tn-lorenz/awesome-learnharness/blob/main/README.md) 的 Plugins 表格追加一行：

```markdown
| [learnharness-zh-cn-language-pack](https://github.com/zdotta/learnharness-zh-plugin) | [zdotta](https://github.com/zdotta) | Simplified Chinese UI (DOM translation) + Chinese teaching instructions, coverage report, content protection | n.a. |
```

## 2. GitHub Discussions（Show and tell）

仓库已开启 Discussions，分类：Announcements / General / Ideas / Polls / Q&A / **Show and tell**。
发到 <https://github.com/amosblomqvist/learnharness/discussions> 的 Show and tell：

> **简体中文语言包（社区插件）— Simplified Chinese language pack**
>
> I built a community plugin that turns the LearnHarness UI into Simplified Chinese and adds
> Chinese teaching instructions for teacher/prober/practice. It is a DOM-layer transitional
> solution (no i18n API in 0.6.x/0.7.0), with a coverage report view and content protection
> for prose/inputs/model output/code/formulas.
>
> - Repo: https://github.com/zdotta/learnharness-zh-plugin
> - Tested on 0.7.0 (minAppVersion 0.6.1), 23 unit tests + M1/M2 integration acceptance
> - Install: copy `dist/` to `<learning data>/plugins/zh-cn-language-pack/dist`, refresh, enable
> - Known limits: first-paint flash, Electron native chrome not covered
>
> Feedback on missing strings is welcome — the plugin exports an untranslated JSON report.

## 3. Discord

<https://discord.gg/5tCHHQEB2e> — 简短介绍 + 仓库链接 + 截图，放在插件/展示频道。

## 4. 维护节奏

- 每次上游大版本：跑 `node tests/integration/scan-settings.mjs` 和 `scan.mjs`，把新漏词补进
  `src/dictionary.extra.ts` 或上游词典。
- 更新 `manifest.version` 与 `minAppVersion`，重新打 Release。
- 与核心 PR #818 的关系：上游合并 i18n 后本插件检测到 `html lang=zh` 会自动停用。
