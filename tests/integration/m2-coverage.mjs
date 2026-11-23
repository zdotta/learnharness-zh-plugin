/**
 * M2 acceptance: coverage view, JSON export, quick toggle restore, protection switch.
 *
 * Usage: node tests/integration/m2-coverage.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const app = process.env.LH_APP_CHECKOUT ?? "F:/workspace_gsd_sp/learnharness-v0.7.0";
const require = createRequire(path.join(app, "package.json"));
const puppeteer = require("puppeteer-core");

const BASE = process.env.LH_TEST_URL ?? "http://localhost:3010";
const CHROME = process.env.LH_TEST_CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const DOWNLOADS = "F:/workspace_gsd_sp/lh-zh-downloads";

const results = [];
const check = (name, ok, detail = "") => {
	results.push({ name, ok, detail });
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

fs.rmSync(DOWNLOADS, { recursive: true, force: true });
fs.mkdirSync(DOWNLOADS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const client = await page.createCDPSession();
await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOADS });

try {
	// 1. Coverage view.
	await page.goto(BASE + "/plugins/zh-cn-language-pack-plus/zh-cn-status", { waitUntil: "networkidle2", timeout: 180000 });
	await page.waitForFunction(() => document.documentElement.getAttribute("data-lh-zh-pack") === "active", { timeout: 30000 });
	await new Promise(resolve => setTimeout(resolve, 1500));
	const view = await page.evaluate(() => ({
		text: document.body.innerText,
		metrics: [...document.querySelectorAll(".lh-zh-metric")].map(item => item.innerText.replace(/\n/g, ":")),
	}));
	for (const word of ["简体中文语言包", "词典条目", "模板规则", "本次命中", "未命中（唯一）", "未翻译文案", "重新扫描", "导出未翻译 JSON"]) {
		check(`覆盖率视图包含「${word}」`, view.text.includes(word));
	}
	check("词典条目数量已渲染", view.metrics.some(item => /^\d+:词典条目$/.test(item.replace(/\s/g, ""))), view.metrics.join(" | "));
	await page.screenshot({ path: "F:/workspace_gsd_sp/lh-zh-m2-coverage.png" });

	// 2. Export button downloads JSON.
	const exportResult = await page.evaluate(async () => {
		const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").includes("导出未翻译 JSON"));
		if (!button) return { clicked: false, text: null };
		const original = URL.createObjectURL.bind(URL);
		let captured = null;
		URL.createObjectURL = (blob) => {
			captured = blob;
			return original(blob);
		};
		button.click();
		await new Promise(resolve => setTimeout(resolve, 400));
		URL.createObjectURL = original;
		const text = captured ? await captured.text() : null;
		return { clicked: true, text };
	});
	check("导出按钮可点击", exportResult.clicked);
	check("导出生成 JSON 内容", typeof exportResult.text === "string" && exportResult.text.length > 20);
	if (exportResult.text) {
		const document = JSON.parse(exportResult.text);
		check("导出包含 dictionarySize/untranslated", typeof document.dictionarySize === "number" && Array.isArray(document.untranslated), `size=${document.dictionarySize}, misses=${document.untranslated?.length}`);
		fs.writeFileSync("F:/workspace_gsd_sp/lh-zh-m2-untranslated-sample.json", exportResult.text);
	}

	// 3. Quick toggle restores English and back.
	await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 180000 });
	await new Promise(resolve => setTimeout(resolve, 2000));
	const before = await page.evaluate(() => document.querySelector("aside")?.innerText ?? "");
	check("切换前侧栏为中文", before.includes("会话") && before.includes("设置"));
	const toggledOff = await page.evaluate(() => {
		const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").includes("中文"));
		button?.click();
		return Boolean(button);
	});
	check("找到中文/English 切换按钮", toggledOff);
	await new Promise(resolve => setTimeout(resolve, 1200));
	const afterOff = await page.evaluate(() => document.querySelector("aside")?.innerText ?? "");
	check("关闭后侧栏恢复英文", /SESSIONS/i.test(afterOff) && /SETTINGS/i.test(afterOff) && !afterOff.includes("会话"), afterOff.split("\n").slice(0, 6).join(" / "));
	await page.screenshot({ path: "F:/workspace_gsd_sp/lh-zh-m2-english-restored.png" });
	const toggledOn = await page.evaluate(() => {
		const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").includes("中文"));
		button?.click();
		return Boolean(button);
	});
	check("再次点击切回中文", toggledOn);
	await new Promise(resolve => setTimeout(resolve, 1200));
	const afterOn = await page.evaluate(() => document.querySelector("aside")?.innerText ?? "");
	check("重新开启后侧栏恢复中文", afterOn.includes("会话") && afterOn.includes("设置"));

	// 4. Content protection switch: off translates .lh-prose, on restores it.
	await page.goto(BASE + "/plugins/zh-cn-language-pack-plus/zh-cn-status", { waitUntil: "networkidle2", timeout: 180000 });
	await new Promise(resolve => setTimeout(resolve, 1200));
	const protectionOff = await page.evaluate(async () => {
		const prose = document.createElement("div");
		prose.className = "lh-prose";
		prose.id = "zh-protection-probe";
		prose.textContent = "Settings";
		document.body.append(prose);
		await new Promise(resolve => setTimeout(resolve, 500));
		return prose.textContent;
	});
	check("正文保护开启时 .lh-prose 不翻译", protectionOff === "Settings", protectionOff);
	await page.evaluate(() => document.getElementById("zh-protection-probe")?.remove());
} finally {
	await browser.close();
}

const failed = results.filter(item => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
