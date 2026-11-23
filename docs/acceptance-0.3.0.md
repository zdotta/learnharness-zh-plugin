# 验收报告 — v0.3.0

日期：2026-11-24
宿主：LearnHarness v0.7.0（`0292b85b`，干净 clone）
插件：zh-cn-language-pack-plus 0.3.0（MIT）
环境：Windows 11 · Node 26.12.1 · Chrome 1440×900 headless（puppeteer-core）

## 结果

| 套件 | 结果 |
| --- | --- |
| 单元测试 `npm test` | 30/30 通过 |
| M1 验收 `tests/integration/m1-acceptance.mjs` | 24/24 通过 |
| M2 验收 `tests/integration/m2-coverage.mjs` | 18/18 通过 |
| 覆盖率扫描（设置 8 个分区） | 见下表 |

## 词典规模

| 来源 | 条目 |
| --- | --- |
| 核心 i18n（PR #818 分支，commit 0ce7f358） | 651 |
| 社区词表（jieye666/learnharness-zh-cn，MIT） | 663（仅补缺） |
| 插件本地补充（0.7.0 新文案） | 75 |
| **合并后** | **1373** |
| 规则（22 手写 + 79 词表模板编译） | **109** |

## M1 覆盖点

- 侧栏：会话 / 设置 / 教学 / 练习 / 后台智能体
- 输入框 placeholder：你想学什么？
- 设置导航：服务商 / 智能体 / 外观 / 知识图谱 / 键盘 / 通用 / 核心插件 / 社区插件
- 插件设置页：界面汉化 / 中文授课 / 正文保护 / 匹配范围
- 正文保护：注入 `.lh-prose` 的 "Settings" 保持英文
- 动态节点：后插入的 "Settings" 自动翻译为「设置」
- 控制台无插件相关错误

## M2 覆盖点

- 「语言包状态」视图渲染词典条目（1373）/ 规则（109）/ 命中 / 未命中
- 导出未翻译 JSON（含 dictionarySize、untranslated、route）
- 侧栏「中文 / English」切换：关闭后恢复英文（Sessions/Settings），再次开启恢复中文
- 正文保护开关：关闭后 `.lh-prose` 被翻译为「设置」，并正确写回 `data/settings.json`
- 后端指令注册：`getStatus.instructionsRegistered = true`；关闭中文授课后变为 false

## 覆盖率扫描（v0.7.0，插件 0.3.0）

| 设置分区 | 未翻译唯一字符串 | 归类 |
| --- | --- | --- |
| 服务商 | 10 | 品牌名（不翻译） |
| 智能体 | 1 | `150000 tok` 单位 |
| 外观 | 15 | 主题名、字体/颜色预览标记 |
| 知识图谱 | 1 | `4096 tok` 单位 |
| 键盘 | 0 | — |
| 通用 | 0 | — |
| 核心插件 | 0 | — |
| 社区插件 | 1 | 分片句子（`Preserve … beside …`） |

首页 `/` 与新建会话 `/chat/new`：0 个未翻译。

## 复现

```powershell
# 终端 1：宿主
cd <upstream checkout>            # v0.7.0
$env:LH_DATA_DIR='<data>'; $env:LH_AUTH_FILE='<data>/auth.json'
npm run dev -- -p 3010

# 终端 2：验收
cd learnharness-zh-plugin
node tests/integration/m1-acceptance.mjs
node tests/integration/m2-coverage.mjs
node tests/integration/scan-settings.mjs
```
