/**
 * M1 acceptance: home / sidebar / settings must be Chinese in a real app window.
 *
 * Usage:
 *   node tests/integration/m1-acceptance.mjs [--scan]
 *
 * Requires a running app (default http://localhost:3010) with the plugin
 * installed and enabled, plus a local Chrome.
 */
import path from "node:path";
import { createRequire } from "node:module";

const app = process.env.LH_APP_CHECKOUT ?? "F:/workspace_gsd_sp/learnharness-v0.7.0";
const require = createRequire(path.join(app, "package.json"));
const puppeteer = require("puppeteer-core");

const BASE = process.env.LH_TEST_URL ?? "http://localhost:3010";
const CHROME = process.env.LH_TEST_CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SCAN = process.argv.includes("--scan");

const results = [];
function check(name, ok, detail = "") {
	results.push({ name, ok, detail });
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const consoleErrors = [];
page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", error => consoleErrors.push(String(error)));

try {
	await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 180000 });
	await page.waitForFunction(() => document.documentElement.getAttribute("data-lh-zh-pack") === "active", { timeout: 30000 });
	await new Promise(resolve => setTimeout(resolve, 1200));

	const home = await page.evaluate(() => ({
		aside: document.querySelector("aside")?.innerText ?? "",
		placeholder: document.querySelector("[data-placeholder]")?.getAttribute("data-placeholder") ?? "",
		body: document.body.innerText,
	}));
	for (const word of ["会话", "设置", "教学", "练习", "后台智能体"]) {
		check(`侧栏包含「${word}」`, home.aside.includes(word));
	}
	check("输入框 placeholder 为「你想学什么？」", home.placeholder === "你想学什么？", home.placeholder);

	// Protected prose must stay English; normal nodes must translate live.
	const protection = await page.evaluate(async () => {
		const prose = document.createElement("div");
		prose.className = "lh-prose";
		prose.textContent = "Settings";
		const plain = document.createElement("div");
		plain.id = "zh-probe-plain";
		plain.textContent = "Settings";
		document.body.append(prose, plain);
		await new Promise(resolve => setTimeout(resolve, 600));
		const out = { prose: prose.textContent, plain: plain.textContent };
		prose.remove();
		plain.remove();
		return out;
	});
	check("正文保护：.lh-prose 保持英文", protection.prose === "Settings", protection.prose);
	check("动态节点自动翻译", protection.plain === "设置", protection.plain);

	// Settings dialog navigation.
	const opened = await page.evaluate(() => {
		const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").trim() === "设置");
		button?.click();
		return Boolean(button);
	});
	check("设置按钮可打开设置", opened);
	await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
	await new Promise(resolve => setTimeout(resolve, 900));
	const dialog = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText ?? "");
	for (const word of ["服务商", "智能体", "外观", "知识图谱", "键盘", "通用", "核心插件", "社区插件"]) {
		check(`设置导航包含「${word}」`, dialog.includes(word));
	}
	check("设置标题为「设置」", dialog.startsWith("设置"), dialog.slice(0, 40));

	// Plugin settings page.
	const pluginNav = await page.evaluate(() => {
		const item = [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="tab"], [role="dialog"] a')]
			.find(element => (element.textContent ?? "").trim() === "简体中文语言包");
		item?.click();
		return Boolean(item);
	});
	check("插件出现在设置导航中", pluginNav);
	await new Promise(resolve => setTimeout(resolve, 900));
	const pluginPage = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText ?? "");
	for (const word of ["界面汉化", "中文授课", "正文保护", "匹配范围"]) {
		check(`插件设置包含「${word}」`, pluginPage.includes(word));
	}

	await page.screenshot({ path: "F:/workspace_gsd_sp/lh-zh-m1-settings-plugin.png" });

	if (SCAN) {
		const untranslated = await page.evaluate(() => {
			const TEXT_SKIP = 'script,style,noscript,pre,code,kbd,samp,textarea,[contenteditable="true"],[data-zh-skip],.lh-prose,[data-streamdown],[data-testid^="message"]';
			const found = new Map();
			const note = (text, kind) => {
				const value = text.replace(/\s+/g, " ").trim();
				if (value.length < 2 || !/[A-Za-z]{2,}/.test(value)) return;
				if (/[\u4e00-\u9fff]/.test(value)) return;
				found.set(value, (found.get(value) ?? 0) + 1);
			};
			const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
			let node;
			while ((node = walker.nextNode())) {
				if (node.parentElement?.closest(TEXT_SKIP)) continue;
				note(node.nodeValue ?? "", "text");
			}
			for (const element of document.body.querySelectorAll("*")) {
				if (element.closest(TEXT_SKIP)) continue;
				for (const name of ["placeholder", "title", "aria-label", "alt", "data-placeholder"]) {
					const value = element.getAttribute(name);
					if (value) note(value, "attr");
				}
			}
			return [...found.entries()].sort((a, b) => b[1] - a[1]);
		});
		console.log("\n=== 未翻译候选 (count desc) ===");
		for (const [text, count] of untranslated) console.log(`${String(count).padStart(3)}  ${text}`);
	}

	check("无插件相关控制台错误", consoleErrors.filter(text => /zh-cn|language-pack/i.test(text)).length === 0, consoleErrors.slice(0, 3).join(" | "));
} finally {
	await browser.close();
}

const failed = results.filter(item => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
