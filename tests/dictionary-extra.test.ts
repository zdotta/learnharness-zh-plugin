import test from "node:test";
import assert from "node:assert/strict";
import { DICTIONARY } from "../src/dictionary";
import { DICTIONARY_EXTRA } from "../src/dictionary.extra";
import { placeholders } from "../src/matcher";

test("extra entries never duplicate generated dictionary keys", () => {
	for (const key of Object.keys(DICTIONARY_EXTRA)) {
		assert.equal(key in DICTIONARY, false, `duplicate key in extra dictionary: ${key}`);
	}
});

test("extra entries are non-empty and placeholder-aligned", () => {
	for (const [key, value] of Object.entries(DICTIONARY_EXTRA)) {
		assert.ok(key.trim().length > 0);
		assert.ok(value.trim().length > 0, `empty translation: ${key}`);
		assert.deepEqual(placeholders(value), placeholders(key), `placeholder mismatch: ${key}`);
	}
});

test("merged dictionary has no empty values", () => {
	for (const [key, value] of Object.entries({ ...DICTIONARY, ...DICTIONARY_EXTRA })) {
		assert.ok(value.trim().length > 0, `empty translation: ${key}`);
	}
});
