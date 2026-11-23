/**
 * Import the MIT-licensed community dictionary from jieye666/learnharness-zh-cn
 * into src/dictionary.community.ts.
 *
 * Usage:
 *   npx tsx scripts/import-community-dictionary.ts [source.json]
 *
 * Only entries that the core i18n dictionary does not already define are kept.
 * Template entries ({0}/{1}) are preserved verbatim; the runtime compiles them
 * into anchored rules at activation time.
 */
import fs from "node:fs";
import path from "node:path";
import { DICTIONARY } from "../src/dictionary";

const source = path.resolve(process.argv[2] ?? "third_party/jieye666/dict.source.json");
const output = path.resolve("src/dictionary.community.ts");
const community = JSON.parse(fs.readFileSync(source, "utf8")) as Record<string, string>;

const PLACEHOLDER = /\{(\d)\}/g;
const entries: [string, string][] = [];
for (const [key, value] of Object.entries(community)) {
	if (typeof value !== "string" || !key.trim() || !value.trim()) continue;
	if (key in DICTIONARY) continue;
	const ids = [...key.matchAll(PLACEHOLDER)].map(match => Number(match[1]));
	if (ids.some(id => id !== 0 && id !== 1)) continue;
	if (/{d}/.test(value) && !ids.includes(0)) continue;
	entries.push([key, value]);
}
entries.sort(([a], [b]) => a.localeCompare(b));

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: https://github.com/jieye666/learnharness-zh-cn (dict.source.json)
 * License: MIT, Copyright (c) 2026 jieye666 (see third_party/jieye666/LICENSE)
 * Entries: ${entries.length} (only keys absent from the core i18n dictionary)
 *
 * Regenerate with: npx tsx scripts/import-community-dictionary.ts
 */

export const DICTIONARY_COMMUNITY: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(entries), null, "\t")};
`;
fs.writeFileSync(output, banner, "utf8");
console.log(`Wrote ${path.relative(process.cwd(), output)}: ${entries.length} entries`);
