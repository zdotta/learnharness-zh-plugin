/**
 * Regenerate src/dictionary.ts from the core i18n branch of a LearnHarness checkout.
 *
 * The dictionary is owned by the core i18n work (PR #818); the plugin only
 * consumes it so both tracks share one translation memory.
 *
 * Usage:
 *   npm run export:dictionary
 *   LH_I18N_SOURCE=/path/to/src/core/i18n/zh-CN/index.ts npm run export:dictionary
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const i18nIndex = path.resolve(
	process.env.LH_I18N_SOURCE ?? path.join("..", "learnharness", "src", "core", "i18n", "zh-CN", "index.ts"),
);
if (!fs.existsSync(i18nIndex)) throw new Error(`Missing i18n index: ${i18nIndex}`);

const repo = process.env.LH_I18N_REPO ?? path.resolve(path.dirname(i18nIndex), "..", "..", "..", "..");
let commit = "unknown";
try {
	commit = execFileSync("git", ["-C", repo, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
} catch {
	// A source export without a git checkout is still valid; the banner records "unknown".
}

const module = (await import(pathToFileURL(i18nIndex).href)) as { ZH_CN?: Record<string, string> };
const dictionary = module.ZH_CN;
if (!dictionary) throw new Error("The i18n index must export ZH_CN");

const entries = Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b));
for (const [key, value] of entries) {
	if (!key.trim()) throw new Error("Empty dictionary key");
	if (!value.trim()) throw new Error(`Empty translation for ${JSON.stringify(key)}`);
	const placeholders = (text: string) => [...text.matchAll(/\{[a-zA-Z0-9_.-]+\}/g)].map(m => m[0]).sort();
	const expected = placeholders(key);
	const actual = placeholders(value);
	if (expected.join("|") !== actual.join("|")) {
		throw new Error(`Placeholder mismatch for ${JSON.stringify(key)}: ${expected} vs ${actual}`);
	}
}

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: LearnHarness core i18n (feat/i18n-zh-cn) src/core/i18n/zh-CN/*.ts
 * Commit: ${commit}
 * Entries: ${entries.length}
 *
 * Regenerate with: npm run export:dictionary
 */

export const DICTIONARY: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(entries), null, "\t")};
`;

const output = path.join("src", "dictionary.ts");
fs.writeFileSync(output, banner, "utf8");
console.log(`Wrote ${output}: ${entries.length} entries (source commit ${commit})`);
