/**
 * Pure translation matcher: English source text -> Simplified Chinese.
 *
 * Priority (see plan 3.4):
 *   1. exact match after trimming (dictionary);
 *   2. template rules (balanced scope only);
 *   3. already-Chinese text is skipped;
 *   4. no match -> undefined (caller records a coverage miss and keeps English).
 *
 * The functions here are pure and synchronous so they can be unit-tested
 * without a DOM.
 */

export type MatchScope = "strict" | "balanced";

export interface DictionaryRule {
	/** Stable identifier used by coverage/debug output. */
	id: string;
	/** Anchored whole-string pattern; must not be global (no /g) so exec is stateless. */
	pattern: RegExp;
	/** Builds the Chinese text from a successful match. */
	build: (match: RegExpExecArray) => string;
}

export type Dictionary = Readonly<Record<string, string>>;

export interface MatcherOptions {
	scope?: MatchScope;
}

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/;
const LATIN = /[A-Za-z]/;
const PLACEHOLDER = /\{[a-zA-Z0-9_.-]+\}/g;

/** True when the text already contains CJK characters (already Chinese). */
export function hasCjk(text: string): boolean {
	return CJK.test(text);
}

/** Placeholder names in first-appearance order, e.g. {count} -> ["count"]. */
export function placeholders(text: string): string[] {
	return [...text.matchAll(PLACEHOLDER)].map(match => match[0]);
}

export class Translator {
	private readonly dictionary: Dictionary;
	private readonly rules: readonly DictionaryRule[];

	constructor(dictionary: Dictionary, rules: readonly DictionaryRule[] = []) {
		this.dictionary = dictionary;
		this.rules = rules;
	}

	/** Translate one trimmed string. Returns undefined when nothing matched. */
	translate(text: string, options: MatcherOptions = {}): string | undefined {
		const scope = options.scope ?? "balanced";
		const value = text.trim();
		if (!value) return undefined;
		if (hasCjk(value)) return undefined;
		// Cheap rejection: pure numbers/punctuation are never dictionary keys.
		if (!LATIN.test(value)) return undefined;

		const exact = this.dictionary[value];
		if (exact !== undefined) return exact;
		if (scope === "strict") return undefined;
		// Rule matching tolerates narrow/no-break spaces produced by Intl formatting.
		const ruleValue = value.replace(/[\u00a0\u202f]/g, " ");
		for (const rule of this.rules) {
			rule.pattern.lastIndex = 0;
			const match = rule.pattern.exec(ruleValue);
			if (match) return rule.build(match);
		}
		return undefined;
	}

	/** Number of dictionary entries (status view). */
	get size(): number {
		return Object.keys(this.dictionary).length;
	}

	get ruleCount(): number {
		return this.rules.length;
	}
}

/** Convenience wrapper used by the DOM engine and tests. */
export function createTranslator(dictionary: Dictionary, rules: readonly DictionaryRule[] = []): Translator {
	return new Translator(dictionary, rules);
}
