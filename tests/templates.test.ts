import test from "node:test";
import assert from "node:assert/strict";
import { DICTIONARY } from "../src/dictionary";
import { DICTIONARY_COMMUNITY } from "../src/dictionary.community";
import { DICTIONARY_EXTRA } from "../src/dictionary.extra";
import { RULES } from "../src/dictionary.rules";
import { compileTemplateRules } from "../src/templates";
import { createTranslator } from "../src/matcher";

test("community dictionary never duplicates core keys", () => {
	for (const key of Object.keys(DICTIONARY_COMMUNITY)) {
		assert.equal(key in DICTIONARY, false, `duplicate key: ${key}`);
	}
});

test("community dictionary only uses supported placeholders", () => {
	for (const [key, value] of Object.entries(DICTIONARY_COMMUNITY)) {
		const ids = [...key.matchAll(/\{(\d)\}/g)].map(m => Number(m[1]));
		assert.ok(ids.every(id => id === 0 || id === 1), `unsupported placeholder: ${key}`);
		assert.ok(value.trim().length > 0, `empty value: ${key}`);
	}
});

test("template rules translate count sentences", () => {
	const rules = compileTemplateRules({ "{0} nodes": "{0} 个节点" });
	const translator = createTranslator({}, rules);
	assert.equal(translator.translate("3 nodes"), "3 个节点");
	assert.equal(translator.translate("12 nodes"), "12 个节点");
});

test("template rules swallow the optional plural marker", () => {
	const rules = compileTemplateRules({ "Plan · {0} node{1}": "计划 · {0} 个节点" });
	const translator = createTranslator({}, rules);
	assert.equal(translator.translate("Plan · 4 node"), "计划 · 4 个节点");
	assert.equal(translator.translate("Plan · 4 nodes"), "计划 · 4 个节点");
});

test("multiple captures map in order", () => {
	const rules = compileTemplateRules({ "{0} of {0}": "{0} / {0}" });
	const translator = createTranslator({}, rules);
	assert.equal(translator.translate("3 of 9"), "3 / 9");
});

test("merged dictionary is large and complete", () => {
	const merged = { ...DICTIONARY, ...DICTIONARY_COMMUNITY, ...DICTIONARY_EXTRA };
	assert.ok(Object.keys(merged).length >= 1300, `expected >= 1300, got ${Object.keys(merged).length}`);
	for (const [key, value] of Object.entries(merged)) {
		assert.ok(value.trim().length > 0, `empty translation: ${key}`);
	}
});

test("runtime rule set includes compiled community templates", () => {
	const rules = [...RULES, ...compileTemplateRules(DICTIONARY_COMMUNITY)];
	assert.ok(rules.length >= 100, `expected >= 100 rules, got ${rules.length}`);
});
