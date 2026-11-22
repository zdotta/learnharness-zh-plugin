# 简体中文语言包（LearnHarness 社区插件）

> **非官方插件。** LearnHarness 目前没有 i18n / locale API（0.6.1–0.7.0）。本插件用
> DOM 改写 + 智能体指令提供简体中文过渡体验，不是产品级国际化方案，也不属于宿主 API 契约。
> 上游核心 i18n（PR #818）合并后，本插件会在检测到宿主已中文时自动停用。

- **插件 ID**：`zh-cn-language-pack`
- **名称**：简体中文语言包
- **版本**：0.2.0
- **最低宿主版本**：0.6.1（在 0.7.0 上完成验收）
- **许可**：AGPL-3.0-only

## 功能

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| 界面汉化 | 开 | DOM 翻译宿主界面文案（文本节点 + `placeholder`/`title`/`aria-label`/`alt`/`data-placeholder`） |
| 中文授课 | 开 | 向 teacher / prober / practice 智能体注入简体中文授课指令 |
| 正文保护 | 开 | 跳过课程正文、输入框、模型输出、代码、公式，避免误翻学习内容 |
| 覆盖率报告 | — | 「语言包状态」视图：命中/未命中统计、Top 50 未翻译文案、导出 JSON |
| 快速切换 | — | 侧栏「中文 / English」一键开关界面汉化 |

## 安装（本地）

```powershell
# 1. 构建
cd learnharness-zh-plugin
npm ci
npm run build

# 2. 安装到学习数据目录的 plugins/
node scripts/install-plugin-local.mjs "<learning data>/plugins"

# 3. 启用：编辑 <learning data>/plugins-state.json
#    {"version":1,"enabled":{"zh-cn-language-pack":true}}

# 4. 启动 LearnHarness（重启以加载新代码）
```

首次启用后，在 **设置 → 社区插件** 中可以看到「简体中文语言包」及其设置页。

## 设置项

| key | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ui` | toggle | true | 界面汉化总开关 |
| `teaching` | toggle | true | 中文授课指令（下一次模型调用生效） |
| `protectContent` | toggle | true | 正文/输入/模型输出/代码/公式保护 |
| `showUntranslated` | toggle | false | 控制台打印未翻译文案，便于补词 |
| `scope` | dropdown | balanced | strict 仅精确匹配；balanced 精确 + 模板规则 |

设置持久化在插件自己的 `data/settings.json`（原子写入），不修改宿主设置。

## 覆盖率

- 「语言包状态」视图显示词典条目数、模板规则数、本次命中与未命中（唯一）。
- 「导出未翻译 JSON」可导出当前窗口的未翻译清单（含 route 与出现次数），用于补充词典或提交 PR。
实测（Chrome 1440×900，v0.7.0，v0.2.0 插件）：

| 界面 | 未翻译的可见文案（唯一） | 说明 |
| --- | --- | --- |
| 首页 / 侧栏 | 0 | 含搜索框、输入框 placeholder、空状态 |
| 新建会话 | 0 | 含发送按钮 aria-label |
| 设置：标题 + 导航 | 0 | 服务商/智能体/外观/知识图谱/键盘/通用/核心插件/社区插件 |
| 设置：通用 / 键盘 | 0 | — |
| 设置：服务商 | 10 | 全部是品牌名（ChatGPT、Grok、Ollama…），按设计不翻译 |
| 设置：智能体 | 4 | 工具标识（tool research/demo/visual/pdf）与 `150000 tok` 单位，按设计保留 |
| 设置：外观 | 17 | 主题名、字体预览标记（Aa/ai/dark/light）与颜色 hex，按设计保留 |
| 核心插件 | 12 | 其他插件的名称与描述，属于「不翻译其他插件文案」的非目标 |

> 扫描脚本会把这些「按设计保留」的字符串也列出来，判断标准见 `src/dictionary.extra.ts` 顶部注释。

## 已知限制

1. **首屏闪烁**：插件在 hydration 之后才激活，首帧必然是英文，通常 <300ms。
2. **不能覆盖**：Electron 原生菜单、窗口标题、系统通知、托盘、其他插件自带文案、模型输出正文。
3. **DOM 契约**：上游改版可能让选择器/文案失配；以覆盖率报告定位补齐。
4. **拆分文本**：被 `<code>` 等行内元素切碎的整句只能逐段匹配，可能保留英文片段。
5. **React 重渲染**：MutationObserver 会重新翻译，但极端交互下可能短暂回退英文。
6. **品牌名不翻译**：服务商、主题、字体、颜色 hex、其他插件名称/描述保持原文。

## 开发

```bash
npm ci
npm run sdk          # 从 LearnHarness checkout 生成类型 SDK（.sdk）
npm run export:dictionary   # 从核心 i18n 分支导出 dictionary.ts
npm run typecheck
npm test             # 23 个单元测试
npm run build
```

集成验收（需要本机 Chrome + 运行中的 app）：

```bash
node tests/integration/m1-acceptance.mjs     # 首页/侧栏/设置中文验收
node tests/integration/m2-coverage.mjs       # 覆盖率视图/导出/快速切换/正文保护
node tests/integration/scan.mjs / /chat/new  # 覆盖率扫描
```

环境变量：`LH_APP_CHECKOUT`（宿主 checkout）、`LH_TEST_URL`（默认 http://localhost:3010）、`LH_TEST_CHROME`.

## 词典来源

- `src/dictionary.ts` 由 `scripts/export-dictionary.ts` 生成，来源为核心 i18n 分支
  `src/core/i18n/zh-CN/*.ts`（651 条，commit `0ce7f358`）。**请勿手改。**
- `src/dictionary.extra.ts` 存放插件本地的补充词条（0.7.0 新增设置文案等），可手改。
- `src/dictionary.rules.ts` 存放数字/版本/相对时间等模板规则。

## 版本

| 版本 | 内容 |
| --- | --- |
| 0.1.0 | 插件骨架、词典导出、matcher/engine、设置页；首页/侧栏/设置可中文 |
| 0.2.0 | 覆盖率视图与导出、正文保护、快速切换、补充词典、集成验收脚本 |

## 卸载 / 回退

1. 在 **设置 → 社区插件** 中停用插件（页面立即恢复英文）。
2. 删除 `<learning data>/plugins/zh-cn-language-pack/`，并从 `plugins-state.json` 移除对应条目。
3. 插件不会修改宿主的任何核心设置或学习数据。
