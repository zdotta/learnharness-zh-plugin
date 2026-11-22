/**
 * DOM translation engine (plan 3.5).
 *
 * Design constraints that matter in this app:
 * - React re-renders overwrite text and attributes, so an observer must re-translate
 *   idempotently; already-Chinese values are skipped, so our own writes never loop.
 * - Learner content, prompts, model output, code and formulas must never be touched
 *   (content protection is on by default).
 * - Everything is reversible: dispose() restores the original text/attributes.
 * - Per-node failures are counted, never thrown into React's event loop.
 */

import { hasCjk } from "./matcher";

export const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt", "data-placeholder"] as const;

const BASE_SKIP = ["script", "style", "noscript", "[data-zh-skip]"];

const PROTECTED_TEXT_SKIP = [
	"textarea",
	"input",
	"select",
	"option",
	"pre",
	"code",
	"kbd",
	"samp",
	'[contenteditable="true"]',
	".lh-prose",
	"[data-streamdown]",
	'[data-testid="composer"]',
	'[data-testid^="message"]',
	'[data-testid="settings-dialog"] input',
	'[data-testid="settings-dialog"] textarea',
];

const PROTECTED_ATTRIBUTE_SKIP = ["pre", "code", ".lh-prose", "[data-streamdown]", '[data-testid^="message"]'];

export interface DomTranslatorOptions {
	document?: Document;
	window?: Window;
	/** Pure matcher: trimmed English -> Chinese, or undefined for a miss. */
	translate: (text: string) => string | undefined;
	/** Skip prose/inputs/model output/code/formulas. Default true. */
	protectContent?: boolean;
	onMiss?: (text: string, source: "text" | "attribute", attribute?: string) => void;
	onError?: (error: unknown) => void;
	/** Upper bound of nodes handled per animation frame. */
	maxNodesPerFrame?: number;
}

export interface DomTranslatorStats {
	translatedText: number;
	translatedAttributes: number;
	errors: number;
	pending: number;
}

export interface DomTranslator {
	readonly stats: DomTranslatorStats;
	/** Translate everything reachable from document.body right now. */
	rescan(): void;
	/** Process all queued work synchronously (tests and post-settings changes). */
	flush(): void;
	dispose(): void;
}

type AttributeName = (typeof TRANSLATABLE_ATTRIBUTES)[number];

export function installDomTranslator(options: DomTranslatorOptions): DomTranslator {
	const doc = options.document ?? document;
	const win = options.window ?? doc.defaultView ?? window;
	const translate = options.translate;
	const protectContent = options.protectContent ?? true;
	const maxNodesPerFrame = Math.max(1, options.maxNodesPerFrame ?? 1500);
	const textSkipSelector = [...BASE_SKIP, ...(protectContent ? PROTECTED_TEXT_SKIP : [])].join(",");
	const attributeSkipSelector = [...BASE_SKIP, ...(protectContent ? PROTECTED_ATTRIBUTE_SKIP : [])].join(",");

	const stats: DomTranslatorStats = { translatedText: 0, translatedAttributes: 0, errors: 0, pending: 0 };
	const originalText = new Map<Text, string>();
	const originalAttributes = new Map<Element, Map<string, string>>();
	const pendingText = new Set<Text>();
	const pendingAttributes = new Map<Element, Set<string>>();
	const skipCache = new Map<Element, boolean>();

	let frame: number | null = null;
	let disposed = false;

	const reportError = (error: unknown): void => {
		stats.errors += 1;
		options.onError?.(error);
	};

	const requestFrame = (callback: () => void): number => {
		if (typeof win.requestAnimationFrame === "function") return win.requestAnimationFrame(callback);
		return win.setTimeout(callback, 16) as unknown as number;
	};

	const cancelFrame = (handle: number): void => {
		if (typeof win.cancelAnimationFrame === "function") win.cancelAnimationFrame(handle);
		else win.clearTimeout(handle);
	};

	const matchesSkip = (element: Element, selector: string): boolean => {
		try {
			return element.closest(selector) !== null;
		} catch {
			return false;
		}
	};

	const isTextSkipped = (element: Element): boolean => {
		const cached = skipCache.get(element);
		if (cached !== undefined) return cached;
		const skipped = matchesSkip(element, textSkipSelector);
		skipCache.set(element, skipped);
		return skipped;
	};

	const isAttributeSkipped = (element: Element): boolean => matchesSkip(element, attributeSkipSelector);

	const applyText = (node: Text): void => {
		try {
			const current = node.nodeValue ?? "";
			if (!current) return;
			const trimmed = current.trim();
			if (!trimmed) return;
			const parent = node.parentElement;
			if (!parent || isTextSkipped(parent)) return;
			if (hasCjk(trimmed)) return;
			const translated = translate(trimmed);
			if (translated === undefined) {
				if (/[A-Za-z]{2,}/.test(trimmed)) options.onMiss?.(trimmed, "text");
				return;
			}
			if (translated === trimmed) return;
			if (!originalText.has(node)) originalText.set(node, current);
			const start = current.indexOf(trimmed);
			if (start < 0) return;
			node.nodeValue = current.slice(0, start) + translated + current.slice(start + trimmed.length);
			stats.translatedText += 1;
		} catch (error) {
			reportError(error);
		}
	};

	const applyAttribute = (element: Element, name: string): void => {
		try {
			if (element.isConnected === false) return;
			if (isAttributeSkipped(element)) return;
			const value = element.getAttribute(name);
			if (!value) return;
			const trimmed = value.trim();
			if (!trimmed || hasCjk(trimmed)) return;
			const translated = translate(trimmed);
			if (translated === undefined) {
				if (/[A-Za-z]{2,}/.test(trimmed)) options.onMiss?.(trimmed, "attribute", name);
				return;
			}
			if (translated === trimmed) return;
			let originals = originalAttributes.get(element);
			if (!originals) {
				originals = new Map();
				originalAttributes.set(element, originals);
			}
			if (!originals.has(name)) originals.set(name, value);
			element.setAttribute(name, translated);
			stats.translatedAttributes += 1;
		} catch (error) {
			reportError(error);
		}
	};

	const enqueueText = (node: Text): void => {
		pendingText.add(node);
	};

	const enqueueAttributes = (element: Element): void => {
		for (const name of TRANSLATABLE_ATTRIBUTES) {
			if (!element.getAttribute(name)) continue;
			let names = pendingAttributes.get(element);
			if (!names) {
				names = new Set();
				pendingAttributes.set(element, names);
			}
			names.add(name);
		}
	};

	const scanElementAttributes = (root: Element): void => {
		try {
			if (root.hasAttribute?.("data-zh-skip")) return;
			enqueueAttributes(root);
			for (const element of root.querySelectorAll("*")) {
				if (element.hasAttribute("data-zh-skip")) continue;
				enqueueAttributes(element);
			}
		} catch (error) {
			reportError(error);
		}
	};

	const scanText = (root: Node): void => {
		try {
			const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
			let node = walker.nextNode();
			while (node) {
				enqueueText(node as Text);
				node = walker.nextNode();
			}
		} catch (error) {
			reportError(error);
		}
	};

	const scan = (root: Node): void => {
		if (disposed) return;
		if (root.nodeType === 3) {
			enqueueText(root as Text);
			return;
		}
		if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
		if (root.nodeType === 1) {
			const element = root as Element;
			if (isTextSkipped(element) && isAttributeSkipped(element)) return;
			if (!isTextSkipped(element)) scanText(root);
			if (!isAttributeSkipped(element)) scanElementAttributes(element);
		} else {
			scanText(root);
			const body = (root as Document).body;
			if (body) scanElementAttributes(body);
		}
	};

	const drain = (): void => {
		frame = null;
		if (disposed) return;
		let budget = maxNodesPerFrame;
		for (const node of pendingText) {
			if (budget <= 0) break;
			pendingText.delete(node);
			if (node.isConnected === false) continue;
			applyText(node);
			budget -= 1;
		}
		if (budget > 0) {
			for (const [element, names] of pendingAttributes) {
				if (budget <= 0) break;
				for (const name of names) {
					if (budget <= 0) break;
					applyAttribute(element, name);
					budget -= 1;
				}
				pendingAttributes.delete(element);
			}
		}
		stats.pending = pendingText.size + pendingAttributes.size;
		if (pendingText.size > 0 || pendingAttributes.size > 0) schedule();
	};

	const schedule = (): void => {
		if (disposed || frame !== null) return;
		frame = requestFrame(drain);
	};

	const Observer = (win as unknown as { MutationObserver?: typeof MutationObserver }).MutationObserver ?? MutationObserver;
	const observer = new Observer((records: MutationRecord[]) => {
		if (disposed) return;
		for (const record of records) {
			try {
				if (record.type === "characterData") {
					if (record.target.nodeType === 3) enqueueText(record.target as Text);
					continue;
				}
				if (record.type === "attributes") {
					const name = record.attributeName;
					if (name && (TRANSLATABLE_ATTRIBUTES as readonly string[]).includes(name)) {
						enqueueAttributes(record.target as Element);
					}
					continue;
				}
				skipCache.clear();
				for (const node of record.addedNodes) scan(node);
			} catch (error) {
				reportError(error);
			}
		}
		stats.pending = pendingText.size + pendingAttributes.size;
		schedule();
	});

	observer.observe(doc.body, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
	});

	scan(doc.body);
	drain();

	return {
		stats,
		rescan() {
			if (disposed) return;
			skipCache.clear();
			scan(doc.body);
			drain();
		},
		flush() {
			if (disposed) return;
			if (frame !== null) {
				cancelFrame(frame);
				frame = null;
			}
			drain();
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			observer.disconnect();
			if (frame !== null) cancelFrame(frame);
			frame = null;
			pendingText.clear();
			pendingAttributes.clear();
			for (const [node, original] of originalText) {
				try {
					if (node.isConnected !== false) node.nodeValue = original;
				} catch (error) {
					reportError(error);
				}
			}
			for (const [element, originals] of originalAttributes) {
				try {
					if (element.isConnected === false) continue;
					for (const [name, value] of originals) element.setAttribute(name, value);
				} catch (error) {
					reportError(error);
				}
			}
			originalText.clear();
			originalAttributes.clear();
		},
	};
}
