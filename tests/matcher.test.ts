import test from "node:test";
import assert from "node:assert/strict";
import { DICTIONARY } from "../src/dictionary";
import { RULES } from "../src/dictionary.rules";
import { createTranslator, hasCjk, placeholders } from "../src/matcher";

const translator = createTranslator(DICTIONARY, RULES);

test("exact dictionary match trims surrounding whitespace", () => {
	assert.equal(translator.translate("  Settings  "), "设置");
	assert.equal(translator.translate("Home"), "首页");
});

test("unknown English text returns undefined", () => {
	assert.equal(translator.translate("This string is not in the dictionary at all"), undefined);
});

test("already-Chinese text is skipped", () => {
	assert.equal(translator.translate("设置"), undefined);
	assert.equal(hasCjk("设置"), true);
	assert.equal(hasCjk("Settings"), false);
});

test("strict scope disables template rules", () => {
	assert.equal(translator.translate("12 steps", { scope: "balanced" }), "12 步");
	assert.equal(translator.translate("12 steps", { scope: "strict" }), undefined);
});

test("template rules cover counts, versions and relative time", () => {
	assert.equal(translator.translate("1 session"), "1 个会话");
	assert.equal(translator.translate("3 messages"), "3 条消息");
	assert.equal(translator.translate("Version 0.7.0"), "版本 0.7.0");
	assert.equal(translator.translate("2 days ago"), "2 天前");
	assert.equal(translator.translate("Just now"), "刚刚");
});

test("numbers without letters never match", () => {
	assert.equal(translator.translate("42"), undefined);
	assert.equal(translator.translate("3.14"), undefined);
});

test("placeholder extraction is stable", () => {
	assert.deepEqual(placeholders("Extraction — {phase}"), ["{phase}"]);
	assert.deepEqual(placeholders("no placeholders"), []);
});
