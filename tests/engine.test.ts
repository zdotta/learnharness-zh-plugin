import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { installDomTranslator } from "../src/engine";

class FakeMutationObserver {
	callback: (records: unknown[]) => void;
	constructor(callback: (records: unknown[]) => void) {
		this.callback = callback;
	}
	observe(): void {}
	disconnect(): void {}
	takeRecords(): unknown[] { return []; }
}

function fixture(html: string) {
	const { document, window } = parseHTML(`<html lang="en"><body>${html}</body></html>`);
	(window as unknown as { MutationObserver: typeof FakeMutationObserver }).MutationObserver = FakeMutationObserver;
	return { document, window };
}

const dictionary: Record<string, string> = {
	Settings: "设置",
	Home: "首页",
	"What do you want to learn?": "你想学什么？",
	Search: "搜索",
	"Save changes": "保存更改",
};

const translate = (text: string): string | undefined => dictionary[text];

test("translates text nodes and preserves surrounding whitespace", () => {
	const { document, window } = fixture("<div><span>  Settings  </span></div>");
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate });
	assert.equal(document.querySelector("span")?.textContent, "  设置  ");
	translator.dispose();
});

test("translates placeholder, aria-label and title attributes", () => {
	const { document, window } = fixture(
		'<input placeholder="What do you want to learn?" aria-label="Search" title="Search">',
	);
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate });
	const input = document.querySelector("input")!;
	assert.equal(input.getAttribute("placeholder"), "你想学什么？");
	assert.equal(input.getAttribute("aria-label"), "搜索");
	assert.equal(input.getAttribute("title"), "搜索");
	translator.dispose();
});

test("content protection skips prose, code and textareas", () => {
	const { document, window } = fixture(
		'<div class="lh-prose">Settings</div><pre>Settings</pre><textarea>Settings</textarea><code>Settings</code><p>Home</p>',
	);
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate, protectContent: true });
	assert.equal(document.querySelector(".lh-prose")?.textContent, "Settings");
	assert.equal(document.querySelector("pre")?.textContent, "Settings");
	assert.equal(document.querySelector("textarea")?.textContent, "Settings");
	assert.equal(document.querySelector("code")?.textContent, "Settings");
	assert.equal(document.querySelector("p")?.textContent, "首页");
	translator.dispose();
});

test("disabling content protection allows prose translation", () => {
	const { document, window } = fixture('<div class="lh-prose">Settings</div>');
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate, protectContent: false });
	assert.equal(document.querySelector(".lh-prose")?.textContent, "设置");
	translator.dispose();
});

test("dispose restores original text and attributes", () => {
	const { document, window } = fixture('<p>Settings</p><input placeholder="Search">');
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate });
	assert.equal(document.querySelector("p")?.textContent, "设置");
	translator.dispose();
	assert.equal(document.querySelector("p")?.textContent, "Settings");
	assert.equal(document.querySelector("input")?.getAttribute("placeholder"), "Search");
});

test("repeated scans are idempotent", () => {
	const { document, window } = fixture("<p>Settings</p>");
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate });
	const first = translator.stats.translatedText;
	translator.rescan();
	translator.flush();
	assert.equal(translator.stats.translatedText, first);
	translator.dispose();
});

test("misses are reported and left in English", () => {
	const { document, window } = fixture("<p>Not in dictionary</p>");
	const misses: string[] = [];
	const translator = installDomTranslator({
		document: document as unknown as Document,
		window: window as unknown as Window,
		translate,
		onMiss: text => misses.push(text),
	});
	assert.equal(document.querySelector("p")?.textContent, "Not in dictionary");
	assert.deepEqual(misses, ["Not in dictionary"]);
	translator.dispose();
});

test("Chinese text is never re-translated", () => {
	const { document, window } = fixture("<p>已经中文</p>");
	const translator = installDomTranslator({ document: document as unknown as Document, window: window as unknown as Window, translate });
	assert.equal(document.querySelector("p")?.textContent, "已经中文");
	translator.dispose();
});
