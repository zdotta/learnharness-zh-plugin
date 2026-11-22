/**
 * Plugin-local dictionary supplements.
 *
 * The generated dictionary (dictionary.ts) mirrors the core i18n branch and must
 * not be edited by hand. Strings that exist only in newer app builds, or that the
 * core dictionary has not covered yet, live here so they survive regeneration.
 * When a string lands upstream, delete it here.
 *
 * Deliberately NOT translated here: brand and provider names (ChatGPT, Claude
 * Code, Grok, Ollama…), theme names, font names, colour hex values, and other
 * plugins' own names/descriptions — those are either proper nouns or another
 * plugin's copy.
 */

export const DICTIONARY_EXTRA: Readonly<Record<string, string>> = {
	// Composer / chat chrome (0.7.0).
	Send: "发送",

	// Settings → Agent.
	"Model catalog": "模型目录",
	"Refresh model catalog": "刷新模型目录",
	"Check Pi for new models": "检查 Pi 的新模型",
	"Refreshing…": "正在刷新……",
	"Model catalog updated.": "模型目录已更新。",
	"No catalog changes found.": "未发现目录变更。",
	"No configured providers support catalog refresh.": "已配置的服务商都不支持刷新目录。",
	"Could not refresh. Your current catalog is still available.": "刷新失败，当前目录仍可使用。",
	"Cache: default": "缓存：默认",
	"No models — add a provider key in Keys": "没有模型——请先在「服务商」中添加密钥",
	"Runs every agent of this tier": "驱动该档位的所有智能体",
	"Enter a positive, safely representable whole number.": "请输入一个可安全表示的正整数。",
	"Lets the tutor consult your knowledge map between sessions": "允许导师在会话之间查阅你的知识图谱",
	"Multiple choice": "单项选择题",
	"Free recall": "自由回忆",
	"Tool: research": "工具：研究",
	"Tool: demo": "工具：演示",
	"Tool: visual": "工具：可视化",
	"Tool: pdf": "工具：PDF",
	"Broad local source access, except protected locations": "广泛的本地源访问权限（受保护位置除外）",
	"Automatic": "自动",
	"Use the switch to choose between the default and your saved override.": "用开关在默认值与已保存的覆盖值之间切换。",
	"Strong model": "强力模型",
	"Strong thinking": "强力思考",
	"Cheap model": "轻量模型",
	"Cheap thinking": "轻量思考",
	"Vision model": "视觉模型",
	"Vision thinking": "视觉思考",

	// Settings → Appearance.
	"Default": "默认",
	"Compact session list": "紧凑会话列表",
	"Transcript width": "转录宽度",
	"Adapt question layout": "自适应题目布局",
	"Full": "全宽",
	"background hex": "背景色 hex",
	"accent hex": "强调色 hex",
	"surface hex": "表面色 hex",
	"bold hex": "粗体 hex",
	"border hex": "边框色 hex",
	"italic hex": "斜体 hex",
	"text hex": "文字色 hex",
	"inline code hex": "行内代码 hex",
	"muted text hex": "次要文字 hex",
	"error hex": "错误色 hex",
	"success hex": "成功色 hex",
	"warning hex": "警告色 hex",


	// Settings → Agent: prompt override editor.
	"View default": "查看默认值",
	"+ Add override": "+ 添加覆盖",
	"In use:": "使用中：",
	"Use your override instead of the default": "用你的覆盖值代替默认值",
	"Used by Teacher, Prober and Practice": "教师、提问与练习使用",
	"Used by Teacher and Prober": "教师与提问使用",
	"Method": "方法",
	"Planning": "规划",
	"Predictions": "预测",
	"Question principles": "出题原则",
	"Jobs": "任务",
	"Demos": "演示",
	"Images": "图像",
	"Probe doctrine": "探查准则",
	"Base": "基础",
	"Doctrine": "准则",
	"System prompt": "系统提示词",
	"Voice": "语气",
	"Accuracy": "准确性",
	"Mental model": "心智模型",
	"Question tools": "出题工具",
	"Learner files": "学习者文件",
	"Side conversations": "侧边对话",
	"Formatting": "格式",
	"no search engine configured — set a Tavily, Brave, Exa, Firecrawl, or Ollama search API key": "未配置搜索引擎——请设置 Tavily、Brave、Exa、Firecrawl 或 Ollama 的搜索 API 密钥",

	// Settings → Appearance: colour-field hints.

	// Settings → General / package status.
	"Enabled": "已启用",
	"Disabled": "已禁用",
	"Dictation language": "听写语言",
	"English": "英语",
};
