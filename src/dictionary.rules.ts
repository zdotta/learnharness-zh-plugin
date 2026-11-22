import type { DictionaryRule } from "./matcher";

/**
 * Dynamic template rules for strings the exact dictionary cannot hold
 * (counts, versions, relative times). Keep patterns anchored and literal;
 * every rule must be safe for a whole text node.
 *
 * Rules only run in the "balanced" scope; "strict" is exact-dictionary only.
 */
export const RULES: readonly DictionaryRule[] = [
	{ id: "steps", pattern: /^(\d+) steps?$/, build: m => `${m[1]} 步` },
	{ id: "sessions", pattern: /^(\d+) sessions?$/, build: m => `${m[1]} 个会话` },
	{ id: "messages", pattern: /^(\d+) messages?$/, build: m => `${m[1]} 条消息` },
	{ id: "turns", pattern: /^(\d+) turns?$/, build: m => `${m[1]} 轮` },
	{ id: "tokens", pattern: /^(\d+) tokens?$/, build: m => `${m[1]} token` },
	{ id: "minutes", pattern: /^(\d+) min(?:ute)?s?$/, build: m => `${m[1]} 分钟` },
	{ id: "seconds", pattern: /^(\d+) s(?:ec(?:ond)?s?)?$/, build: m => `${m[1]} 秒` },
	{ id: "hours", pattern: /^(\d+) hours?$/, build: m => `${m[1]} 小时` },
	{ id: "days", pattern: /^(\d+) days?$/, build: m => `${m[1]} 天` },
	{ id: "nodes", pattern: /^(\d+) nodes?$/, build: m => `${m[1]} 个节点` },
	{ id: "cards", pattern: /^(\d+) cards?$/, build: m => `${m[1]} 张卡片` },
	{ id: "files", pattern: /^(\d+) files?$/, build: m => `${m[1]} 个文件` },
	{ id: "words", pattern: /^(\d+) words?$/, build: m => `${m[1]} 个词` },
	{ id: "items", pattern: /^(\d+) items?$/, build: m => `${m[1]} 项` },
	{ id: "problems", pattern: /^(\d+) problems?$/, build: m => `${m[1]} 道题` },
	{ id: "questions", pattern: /^(\d+) questions?$/, build: m => `${m[1]} 个问题` },
	{ id: "version", pattern: /^Version (\d+(?:\.\d+){1,3})$/, build: m => `版本 ${m[1]}` },
	{ id: "minutes-ago", pattern: /^(\d+) min(?:ute)?s? ago$/, build: m => `${m[1]} 分钟前` },
	{ id: "hours-ago", pattern: /^(\d+) hours? ago$/, build: m => `${m[1]} 小时前` },
	{ id: "days-ago", pattern: /^(\d+) days? ago$/, build: m => `${m[1]} 天前` },
	{ id: "just-now", pattern: /^Just now$/, build: () => "刚刚" },
	{ id: "of-total", pattern: /^(\d+) of (\d+)$/, build: m => `${m[1]} / ${m[2]}` },
	{ id: "token-short", pattern: /^(\d+) tok$/, build: m => `${m[1]} tok` },
	{ id: "empty-hex", pattern: /^Empty = (#[0-9a-fA-F]{3,8})$/, build: m => `留空 = ${m[1]}` },
	{ id: "empty-value", pattern: /^Empty = (.+)$/, build: m => `留空 = ${m[1]}` },
	{ id: "empty-hex-labeled", pattern: /^(Focus rings, toggles, selection|Cards, inputs, sidebar) · Empty = (#[0-9a-fA-F]{3,8})$/, build: m => `${m[1] === "Focus rings, toggles, selection" ? "焦点环、开关、选区" : "卡片、输入框、侧栏"} · 留空 = ${m[2]}` },
	{ id: "plugin-version-enabled", pattern: /^(\d+\.\d+\.\d+) · Enabled$/, build: m => `${m[1]} · 已启用` },
	{ id: "plugin-version-disabled", pattern: /^(\d+\.\d+\.\d+) · Disabled$/, build: m => `${m[1]} · 已禁用` },
	{ id: "dictation-language", pattern: /^Dictation language: (.+)$/, build: m => `听写语言：${m[1]}` },
	{ id: "use-override-for", pattern: /^Use your override for (.+)$/, build: m => `为 ${m[1]} 使用你的覆盖` },
];
