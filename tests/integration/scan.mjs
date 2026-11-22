/**
 * Coverage scan for a running app: lists visible English strings that the
 * dictionary/规则 did not translate, grouped per route.
 *
 * Usage: node tests/integration/scan.mjs [route...]
 */
import path from "node:path";
import { createRequire } from "node:module";

const app = process.env.LH_APP_CHECKOUT ?? "F:/workspace_gsd_sp/learnharness-v0.7.0";
const require = createRequire(path.join(app, "package.json"));
const puppeteer = require("puppeteer-core");

const BASE = process.env.LH_TEST_URL ?? "http://localhost:3010";
const CHROME = process.env.LH_TEST_CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/chat/new"];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

for (const route of routes) {
	await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 180000 });
	await new Promise(resolve => setTimeout(resolve, 2500));
	const untranslated = await page.evaluate(() => {
		const TEXT_SKIP = 'script,style,noscript,pre,code,kbd,samp,textarea,[contenteditable="true"],[data-zh-skip],.lh-prose,[data-streamdown],[data-testid^="message"]';
		const found = new Map();
		const note = (text) => {
			const value = text.replace(/\s+/g, " ").trim();
			if (value.length < 2 || !/[A-Za-z]{2,}/.test(value)) return;
			if (/[\u4e00-\u9fff]/.test(value)) return;
			if (/^(Compiling|Rendering|Building|\.\.\.)/.test(value)) return;
			found.set(value, (found.get(value) ?? 0) + 1);
		};
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		let node;
		while ((node = walker.nextNode())) {
			if (node.parentElement?.closest(TEXT_SKIP)) continue;
			note(node.nodeValue ?? "");
		}
		for (const element of document.body.querySelectorAll("*")) {
			if (element.closest(TEXT_SKIP)) continue;
			for (const name of ["placeholder", "title", "aria-label", "alt", "data-placeholder"]) {
				const value = element.getAttribute(name);
				if (value) note(value);
			}
		}
		return [...found.entries()].sort((a, b) => b[1] - a[1]);
	});
	console.log(`\n=== ${route} (${untranslated.length} unique) ===`);
	for (const [text, count] of untranslated) console.log(`${String(count).padStart(3)}  ${text}`);
}
await browser.close();
