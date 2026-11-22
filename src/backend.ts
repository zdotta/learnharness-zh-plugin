/**
 * Backend half of the language pack (plan 3.2).
 *
 * - Registers Simplified-Chinese teaching instructions for the three native agents.
 * - Owns settings persistence under <dataDirectory>/settings.json (atomic writes).
 *
 * The host never persists plugin settings, so this is the only writable state.
 */

import fs from "node:fs";
import path from "node:path";
import type { PluginBackendContext } from "learnharness-plugin-api";
import { DEFAULT_SETTINGS, normalizeSettings, type PluginSettings } from "./settings";

const SETTINGS_FILE = "settings.json";

export const TEACHING_INSTRUCTIONS = `本插件的语言规则（面向学习者的全部输出优先遵守）：
- 讲解、提问、追问、提示、反馈、总结、题目与练习说明一律使用简体中文。
- 学习者用其他语言书写时，仍用简体中文回答；只有学习者明确要求改用其他语言时才切换。
- 代码、命令、文件路径、变量名、数学公式与专有名词保持原文，不做翻译；必要时在首次出现处用中文简要解释。
- 使用第二人称「你」，语气平实、克制，不堆砌感叹号，不使用「您」。
- 术语首次出现时使用「中文（English）」形式，之后只用中文。`;

function settingsPath(ctx: PluginBackendContext): string {
	return path.join(ctx.dataDirectory, SETTINGS_FILE);
}

function readSettings(file: string): PluginSettings {
	try {
		const raw = fs.readFileSync(file, "utf8");
		return normalizeSettings(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

/** Atomic write: write a sibling temp file, then rename over the target. */
function writeSettings(file: string, input: unknown): PluginSettings {
	const normalized = normalizeSettings(input);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
	fs.writeFileSync(temporary, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
	fs.renameSync(temporary, file);
	return normalized;
}

export function activate(ctx: PluginBackendContext): () => void {
	const file = settingsPath(ctx);
	let settings = readSettings(file);

	let unregisterInstructions: (() => void) | undefined;
	const syncTeaching = (next: PluginSettings): void => {
		if (next.teaching && !unregisterInstructions) {
			unregisterInstructions = ctx.registerInstructions({
				agents: ["teacher", "prober", "practice"],
				text: TEACHING_INSTRUCTIONS,
			});
		} else if (!next.teaching && unregisterInstructions) {
			unregisterInstructions();
			unregisterInstructions = undefined;
		}
	};

	ctx.handle("getSettings", async () => settings);
	ctx.handle("setSettings", async (input: unknown) => {
		settings = writeSettings(file, input);
		syncTeaching(settings);
		return settings;
	});
	ctx.handle("getStatus", async () => ({
		version: "0.2.0",
		teachingActive: settings.teaching,
		instructionsRegistered: unregisterInstructions !== undefined,
		settingsFile: file,
	}));

	syncTeaching(settings);

	return () => {
		unregisterInstructions?.();
		unregisterInstructions = undefined;
	};
}
