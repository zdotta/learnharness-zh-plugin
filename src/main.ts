/**
 * Frontend half of the zh-CN language pack (plan 3.2): settings rows, coverage
 * view, quick toggle action and the DOM translation engine.
 *
 * Everything here is best-effort UI translation layered on top of the host.
 * It never touches core settings, learner content or model output.
 */

import type {
	PluginFrontendContext,
	PluginSettingsRow,
	PluginSettingsSchema,
	PluginWidgetHandle,
} from "learnharness-plugin-api";
import { DICTIONARY } from "./dictionary";
import { DICTIONARY_EXTRA } from "./dictionary.extra";
import { RULES } from "./dictionary.rules";
import { createTranslator } from "./matcher";
import { installDomTranslator, type DomTranslator } from "./engine";
import { CoverageCollector } from "./coverage";
import { DEFAULT_SETTINGS, normalizeSettings, type PluginSettings } from "./settings";

const VIEW_ID = "zh-cn-status";
const ACTION_ID = "toggle-zh";

export function activate(ctx: PluginFrontendContext): void {
	const translator = createTranslator({ ...DICTIONARY, ...DICTIONARY_EXTRA }, RULES);
	const coverage = new CoverageCollector();
	const settings: PluginSettings = { ...DEFAULT_SETTINGS };

	let engine: DomTranslator | undefined;
	let settingsHandle: PluginWidgetHandle<PluginSettingsSchema> | undefined;
	let hostLanguage = "";
	let languageOverridden = false;

	const currentRoute = (): string => {
		try {
			return ctx.app.pathname() || "/";
		} catch {
			return "/";
		}
	};

	const hostIsChinese = (): boolean => {
		if (languageOverridden) return false;
		const lang = document.documentElement.lang?.toLowerCase() ?? "";
		return lang.startsWith("zh") || document.documentElement.hasAttribute("data-lh-i18n");
	};

	const translate = (text: string): string | undefined => {
		const result = translator.translate(text, { scope: settings.scope });
		if (result !== undefined) coverage.recordHit(text);
		return result;
	};

	const onMiss = (text: string, source: "text" | "attribute", attribute?: string): void => {
		coverage.recordMiss(text, currentRoute());
		if (settings.showUntranslated) {
			console.debug(`[zh-cn-language-pack] untranslated ${source}${attribute ? ` (${attribute})` : ""}: ${text}`);
		}
	};

	const installEngine = (): void => {
		if (engine || !settings.ui || hostIsChinese()) return;
		engine = installDomTranslator({
			translate,
			protectContent: settings.protectContent,
			onMiss,
			onError: error => console.warn("[zh-cn-language-pack] translation error", error),
		});
		if (!languageOverridden && !document.documentElement.lang.toLowerCase().startsWith("zh")) {
			hostLanguage = document.documentElement.lang;
			document.documentElement.lang = "zh-CN";
			languageOverridden = true;
		}
		document.documentElement.setAttribute("data-lh-zh-pack", "active");
	};

	const removeEngine = (): void => {
		engine?.dispose();
		engine = undefined;
		document.documentElement.removeAttribute("data-lh-zh-pack");
		if (languageOverridden) {
			document.documentElement.lang = hostLanguage;
			languageOverridden = false;
		}
	};

	const rows = (): PluginSettingsRow[] => [
		{
			key: "ui",
			type: "toggle",
			label: "界面汉化",
			description: "把宿主界面文案替换为简体中文。插件在页面加载后激活，首屏可能短暂显示英文。",
			value: settings.ui,
			onChange: value => apply({ ui: value }),
		},
		{
			key: "teaching",
			type: "toggle",
			label: "中文授课",
			description: "向教师、出题与练习智能体注入简体中文授课指令，下一次模型调用起生效。",
			value: settings.teaching,
			onChange: value => apply({ teaching: value }),
		},
		{
			key: "protectContent",
			type: "toggle",
			label: "正文保护",
			description: "跳过课程正文、输入框、模型输出、代码与公式，避免误翻学习内容（建议保持开启）。",
			value: settings.protectContent,
			onChange: value => apply({ protectContent: value }),
		},
		{
			key: "showUntranslated",
			type: "toggle",
			label: "调试：记录未翻译文案",
			description: "在开发者控制台打印未命中的英文文案，便于补充词典；不会写入学习数据。",
			value: settings.showUntranslated,
			onChange: value => apply({ showUntranslated: value }),
		},
		{
			key: "scope",
			type: "dropdown",
			label: "匹配范围",
			description: "严格：仅词典精确匹配。平衡：精确匹配 + 数字/版本等模板规则（推荐）。",
			options: [
				{ value: "strict", label: "严格（仅精确匹配）" },
				{ value: "balanced", label: "平衡（精确 + 模板）" },
			],
			value: settings.scope,
			onChange: value => apply({ scope: value === "strict" ? "strict" : "balanced" }),
		},
	];

	const apply = async (patch: Partial<PluginSettings>): Promise<void> => {
		Object.assign(settings, patch);
		settingsHandle?.update({ rows: rows() });
		try {
			await ctx.call("setSettings", settings);
		} catch (error) {
			console.warn("[zh-cn-language-pack] failed to persist settings", error);
		}
		if (patch.ui !== undefined || patch.protectContent !== undefined || patch.scope !== undefined) {
			removeEngine();
			installEngine();
		}
	};

	const metric = (label: string, value: string | number): HTMLElement => {
		const box = document.createElement("div");
		box.className = "lh-zh-metric";
		const strong = document.createElement("strong");
		strong.textContent = String(value);
		const span = document.createElement("span");
		span.textContent = label;
		box.append(strong, span);
		return box;
	};

	const renderStatus = (
		container: HTMLElement,
		signal: AbortSignal,
		disposables: { dispose(): void }[],
		refresh: () => void,
	): void => {
		for (const disposable of disposables.splice(0)) disposable.dispose();
		container.replaceChildren();
		const root = document.createElement("div");
		root.className = "lh-zh-status";
		container.append(root);

		const title = document.createElement("h2");
		title.textContent = "简体中文语言包";
		const lead = document.createElement("p");
		lead.textContent = hostIsChinese()
			? "宿主已内置中文界面，本插件不启用 DOM 翻译，避免双重翻译。"
			: "社区维护的过渡方案：通过 DOM 改写实现界面汉化，不改变宿主语言设置。上游核心 i18n 合并后本插件会自动停用。";
		root.append(title, lead);

		const metrics = document.createElement("div");
		metrics.className = "lh-zh-metrics";
		metrics.append(
			metric("词典条目", translator.size),
			metric("模板规则", translator.ruleCount),
			metric("本次命中", coverage.hits),
			metric("未命中（唯一）", coverage.uniqueMisses),
		);
		root.append(metrics);

		const actions = document.createElement("div");
		actions.className = "lh-zh-actions";
		root.append(actions);

		const rescanButton = ctx.ui.mountButton(actions, {
			label: "重新扫描",
			onClick: () => {
				engine?.rescan();
				refresh();
			},
		}, { signal });

		const exportButton = ctx.ui.mountButton(actions, {
			label: "导出未翻译 JSON",
			onClick: () => {
				const blob = new Blob([coverage.exportDocument(translator.size, translator.ruleCount)], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `zh-cn-untranslated-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
				link.click();
				window.setTimeout(() => URL.revokeObjectURL(url), 1000);
			},
		}, { signal });

		disposables.push(rescanButton, exportButton);

		const heading = document.createElement("h2");
		heading.textContent = `未翻译文案（Top ${Math.min(50, coverage.uniqueMisses)}）`;
		root.append(heading);

		const list = document.createElement("div");
		list.className = "lh-zh-misses";
		const misses = coverage.topMisses(50);
		if (misses.length === 0) {
			const empty = document.createElement("div");
			empty.className = "lh-zh-empty";
			empty.textContent = "当前窗口没有未命中记录。";
			list.append(empty);
		} else {
			for (const miss of misses) {
				const row = document.createElement("div");
				row.className = "lh-zh-miss";
				const count = document.createElement("em");
				count.textContent = `×${miss.count}`;
				const text = document.createElement("span");
				text.textContent = miss.routes.length ? `${miss.text}  ·  ${miss.routes.join(", ")}` : miss.text;
				row.append(count, text);
				list.append(row);
			}
		}
		root.append(list);

		const hint = document.createElement("p");
		hint.textContent = "把导出的 JSON 或上面的字符串补进 src/dictionary.ts（或提交到插件仓库），即可提升覆盖率。词典来源与核心 i18n 分支共用同一份翻译记忆。";
		root.append(hint);
	};

	ctx.registerView({
		id: VIEW_ID,
		name: "语言包状态",
		mount(container, signal) {
			const disposables: { dispose(): void }[] = [];
			const refresh = (): void => renderStatus(container, signal, disposables, refresh);
			refresh();
			return () => {
				for (const disposable of disposables.splice(0)) disposable.dispose();
				container.replaceChildren();
			};
		},
	});

	ctx.registerAction({
		id: ACTION_ID,
		name: "中文 / English",
		run: async () => {
			await apply({ ui: !settings.ui });
		},
	});
	ctx.placeAction({ id: "zh-toggle-sidebar", actionId: ACTION_ID, location: "sidebar" });

	settingsHandle = ctx.registerSettings({ rows: rows() });

	installEngine();

	void (async () => {
		try {
			const loaded = normalizeSettings(await ctx.call("getSettings"));
			Object.assign(settings, loaded);
			settingsHandle?.update({ rows: rows() });
			removeEngine();
			installEngine();
		} catch (error) {
			console.warn("[zh-cn-language-pack] failed to load settings, using defaults", error);
		}
	})();

	ctx.cleanup(() => {
		removeEngine();
	});
}
