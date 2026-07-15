import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function tokenNames(css) {
	return [...css.matchAll(/(--type-[\w-]+)\s*:/g)].map(([, name]) => name).sort();
}

test("English and Chinese typography adapters implement the same token interface", async () => {
	const [english, chinese] = await Promise.all([
		readProjectFile("src/styles/typography/en.css"),
		readProjectFile("src/styles/typography/zh.css"),
	]);

	assert.match(english, /:root:lang\(en\)/);
	assert.match(chinese, /:root:lang\(zh-CN\)/);
	assert.deepEqual(tokenNames(chinese), tokenNames(english));
	assert.ok(tokenNames(english).length > 0);
});

test("Built pages expose the language selectors used by the typography adapters", async () => {
	const [english, chinese] = await Promise.all([
		readProjectFile("dist/index.html"),
		readProjectFile("dist/zh/index.html"),
	]);

	assert.match(english, /<html\b[^>]*\blang=(?:"en"|en)(?:\s|>)/);
	assert.match(chinese, /<html\b[^>]*\blang=(?:"zh-CN"|zh-CN)(?:\s|>)/);
});
