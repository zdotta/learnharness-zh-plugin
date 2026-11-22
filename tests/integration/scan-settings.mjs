/** Scan every Settings tab for untranslated English strings. */
import path from "node:path";
import { createRequire } from "node:module";
const app = process.env.LH_APP_CHECKOUT ?? "F:/workspace_gsd_sp/learnharness-v0.7.0";
const require = createRequire(path.join(app, "package.json"));
const puppeteer = require("puppeteer-core");

const BASE = process.env.LH_TEST_URL ?? "http://localhost:3010";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950 });
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 180000 });
await new Promise(resolve => setTimeout(resolve, 2000));
await page.evaluate(() => {
	const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").trim() === "设置");
	button?.click();
});
await page.waitForSelector('[role="dialog"]');
await new Promise(resolve => setTimeout(resolve, 800));

const tabs = ["服务商", "智能体", "外观", "知识图谱", "键盘", "通用", "核心插件", "社区插件"];
const scanDialog = () => page.evaluate(() => {
	const dialog = document.querySelector('[role="dialog"]');
	if (!dialog) return [];
	const TEXT_SKIP = 'script,style,noscript,pre,code,kbd,samp,textarea,[contenteditable="true"],[data-zh-skip],.lh-prose,[data-streamdown]';
	const found = new Map();
	const note = value => {
		const text = value.replace(/\s+/g, " ").trim();
		if (text.length < 2 || !/[A-Za-z]{2,}/.test(text) || /[\u4e00-\u9fff]/.test(text)) return;
		found.set(text, (found.get(text) ?? 0) + 1);
	};
	const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
	let node;
	while ((node = walker.nextNode())) {
		if (node.parentElement?.closest(TEXT_SKIP)) continue;
		note(node.nodeValue ?? "");
	}
	for (const element of dialog.querySelectorAll("*")) {
		if (element.closest(TEXT_SKIP)) continue;
		for (const name of ["placeholder", "title", "aria-label", "alt", "data-placeholder"]) {
			const value = element.getAttribute(name);
			if (value) note(value);
		}
	}
	return [...found.entries()].sort((a, b) => b[1] - a[1]);
});

for (const tab of tabs) {
	const ok = await page.evaluate(label => {
		const dialog = document.querySelector('[role="dialog"]');
		const item = [...(dialog?.querySelectorAll("button, [role=tab], a") ?? [])].find(element => (element.textContent ?? "").trim() === label);
		item?.click();
		return Boolean(item);
	}, tab);
	await new Promise(resolve => setTimeout(resolve, 1100));
	const found = await scanDialog();
	console.log(`\n=== 设置 / ${tab} (${found.length}) ===`);
	for (const [text, count] of found) console.log(`${String(count).padStart(3)}  ${text}`);
	if (!ok) console.log("(tab not found)");
	await page.screenshot({ path: `F:/workspace_gsd_sp/lh-zh-settings-${tabs.indexOf(tab)}.png` });
}
await browser.close();
