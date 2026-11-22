/** Capture README screenshots from a running app. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const app = process.env.LH_APP_CHECKOUT ?? "F:/workspace_gsd_sp/learnharness-v0.7.0";
const require = createRequire(path.join(app, "package.json"));
const puppeteer = require("puppeteer-core");

const BASE = process.env.LH_TEST_URL ?? "http://localhost:3010";
const OUT = path.resolve("docs/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 180000 });
await page.waitForFunction(() => document.documentElement.getAttribute("data-lh-zh-pack") === "active", { timeout: 30000 });
await new Promise(resolve => setTimeout(resolve, 1500));
await page.screenshot({ path: path.join(OUT, "home.png") });

await page.evaluate(() => {
	const button = [...document.querySelectorAll("button")].find(item => (item.textContent ?? "").trim() === "设置");
	button?.click();
});
await page.waitForSelector('[role="dialog"]');
await new Promise(resolve => setTimeout(resolve, 1200));
await page.screenshot({ path: path.join(OUT, "settings.png") });

await page.evaluate(() => {
	const item = [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="tab"], [role="dialog"] a')]
		.find(element => (element.textContent ?? "").trim() === "简体中文语言包");
	item?.click();
});
await new Promise(resolve => setTimeout(resolve, 900));
await page.screenshot({ path: path.join(OUT, "plugin-settings.png") });

await page.goto(BASE + "/plugins/zh-cn-language-pack/zh-cn-status", { waitUntil: "networkidle2", timeout: 180000 });
await new Promise(resolve => setTimeout(resolve, 1500));
await page.screenshot({ path: path.join(OUT, "coverage.png") });

await browser.close();
console.log("screenshots ->", OUT);
