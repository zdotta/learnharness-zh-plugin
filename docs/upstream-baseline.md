# 上游基线

本插件针对官方 LearnHarness 代码仓构建与验收，所有 API/构建方式均来自该版本源码：

| 项目 | 值 |
| --- | --- |
| 仓库 | https://github.com/amosblomqvist/learnharness |
| 版本 | v0.7.0（release 2026-11-21） |
| 提交 | 0292b85b |
| 插件 API | v1 |
| SDK 生成 | `node scripts/build-plugin-types.mjs .sdk`（来自该 checkout） |
| 本地 installer | `scripts/install-plugin-local.mjs`（来自该 checkout） |

## 词典基线

`src/dictionary.ts` 由核心 i18n 分支生成：

| 项目 | 值 |
| --- | --- |
| 分支 | feat/i18n-zh-cn（对应 PR #818） |
| 提交 | 0ce7f358 |
| 条目 | 651 |

核心 PR #818 仍是产品级方案；本插件是 0.6.x/0.7.x 的社区过渡层，两者共用同一份翻译记忆。
