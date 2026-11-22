import test from "node:test";
import assert from "node:assert/strict";
import { DICTIONARY } from "../src/dictionary";
import { placeholders } from "../src/matcher";

const entries = Object.entries(DICTIONARY);

test("dictionary is large enough to be useful", () => {
	assert.ok(entries.length >= 600, `expected >= 600 entries, got ${entries.length}`);
});

test("every value is a non-empty string", () => {
	for (const [key, value] of entries) {
		assert.equal(typeof value, "string", key);
		assert.ok(value.trim().length > 0, `empty translation: ${key}`);
	}
});

test("every key looks like English source text", () => {
	for (const [key] of entries) {
		assert.ok(key.trim().length > 0, "empty key");
		assert.ok(!/[\u4e00-\u9fff]/.test(key), `key should not contain Chinese: ${key}`);
	}
});

test("placeholders stay byte-identical between key and value", () => {
	for (const [key, value] of entries) {
		assert.deepEqual(placeholders(value), placeholders(key), `placeholder mismatch: ${key}`);
	}
});

test("core chrome strings are translated", () => {
	assert.equal(DICTIONARY["Settings"], "设置");
	assert.equal(DICTIONARY["Sessions"], "会话");
	assert.equal(DICTIONARY["Teaching"], "教学");
	assert.equal(DICTIONARY["Practice"], "练习");
	assert.equal(DICTIONARY["Home"], "首页");
});
