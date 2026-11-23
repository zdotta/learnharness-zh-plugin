/**
 * Compile dictionary entries that contain {0}/{1} placeholders into anchored
 * rules, so sentences assembled at runtime ("3 nodes selected", "Version 0.6.1",
 * "tool research") can be translated without a static key per value.
 *
 * {0} captures one segment; {1} is an optional English plural "s".
 */

import type { DictionaryRule } from "./matcher";

const PLACEHOLDER = /\{(\d)\}/g;

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compileTemplateRules(dictionary: Readonly<Record<string, string>>): DictionaryRule[] {
	const rules: DictionaryRule[] = [];
	let sequence = 0;
	for (const [key, value] of Object.entries(dictionary)) {
		if (!key.includes("{")) continue;
		const parts: { literal: string; placeholder?: number }[] = [];
		let last = 0;
		let supported = true;
		for (const match of key.matchAll(PLACEHOLDER)) {
			parts.push({ literal: key.slice(last, match.index) });
			const id = Number(match[1]);
			if (id !== 0 && id !== 1) {
				supported = false;
				break;
			}
			parts.push({ literal: "", placeholder: id });
			last = (match.index ?? 0) + match[0].length;
		}
		if (!supported) continue;
		parts.push({ literal: key.slice(last) });

		let source = "^";
		for (const part of parts) {
			if (part.placeholder === 0) {
				source += "(.+?)";
			} else if (part.placeholder === 1) {
				source += "s?";
			} else {
				source += escapeRegExp(part.literal);
			}
		}
		source += "$";
		let pattern: RegExp;
		try {
			pattern = new RegExp(source);
		} catch {
			continue;
		}
		const id = `community-template-${sequence++}`;
		rules.push({
			id,
			pattern,
			build: (match: RegExpExecArray) => {
				let output = "";
				let cursor = 0;
				let group = 1;
				for (const hit of value.matchAll(PLACEHOLDER)) {
					output += value.slice(cursor, hit.index);
					output += Number(hit[1]) === 0 ? (match[group++] ?? "") : "";
					cursor = (hit.index ?? 0) + hit[0].length;
				}
				output += value.slice(cursor);
				return output;
			},
		});
	}
	return rules;
}
