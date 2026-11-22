/** Plugin-owned settings shape, defaults and validation (plan 3.6). */

export type MatchScope = "strict" | "balanced";

export interface PluginSettings {
	/** Master switch for DOM translation. */
	ui: boolean;
	/** Inject Simplified-Chinese teaching instructions into teacher/prober/practice. */
	teaching: boolean;
	/** Protect prose, inputs, model output, code and formulas from translation. */
	protectContent: boolean;
	/** Debug: write untranslated strings to the console. */
	showUntranslated: boolean;
	/** strict = exact dictionary only; balanced = exact + template rules. */
	scope: MatchScope;
}

export const DEFAULT_SETTINGS: PluginSettings = Object.freeze({
	ui: true,
	teaching: true,
	protectContent: true,
	showUntranslated: false,
	scope: "balanced",
});

const SCOPES: readonly MatchScope[] = ["strict", "balanced"];

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

/** Normalize arbitrary persisted/JSON input into a complete settings object. */
export function normalizeSettings(input: unknown): PluginSettings {
	const record = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
	const scope = SCOPES.includes(record.scope as MatchScope) ? (record.scope as MatchScope) : DEFAULT_SETTINGS.scope;
	return {
		ui: bool(record.ui, DEFAULT_SETTINGS.ui),
		teaching: bool(record.teaching, DEFAULT_SETTINGS.teaching),
		protectContent: bool(record.protectContent, DEFAULT_SETTINGS.protectContent),
		showUntranslated: bool(record.showUntranslated, DEFAULT_SETTINGS.showUntranslated),
		scope,
	};
}

/** Merge a single key change onto a settings object. */
export function withSetting<K extends keyof PluginSettings>(settings: PluginSettings, key: K, value: PluginSettings[K]): PluginSettings {
	return { ...settings, [key]: value };
}
