import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteOrigin = "https://automann.github.io";
const basePath = "/astro-kami";

async function readPage(path) {
	return readFile(new URL(`../dist${path}index.html`, import.meta.url), "utf8");
}

function elementAttributes(html, tagName) {
	return [...html.matchAll(new RegExp(`<${tagName}\\b([^>]*)>`, "gi"))].map(([, source]) =>
		Object.fromEntries(
			[...source.matchAll(/([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(
				([, name, doubleQuoted, singleQuoted, unquoted]) => [
					name.toLowerCase(),
					doubleQuoted ?? singleQuoted ?? unquoted ?? "",
				],
			),
		),
	);
}

function linkAttributes(html) {
	return elementAttributes(html, "link");
}

function languageAlternates(html) {
	return linkAttributes(html)
		.filter((attributes) => attributes.rel === "alternate" && attributes.hreflang)
		.map(({ href, hreflang }) => [hreflang, href]);
}

test("Showcase language variants identify each other to search engines", async () => {
	const expected = [
		["en", `${siteOrigin}${basePath}/showcase/`],
		["zh-CN", `${siteOrigin}${basePath}/zh/showcase/`],
		["x-default", `${siteOrigin}${basePath}/showcase/`],
	];

	for (const path of ["/showcase/", "/zh/showcase/"]) {
		const html = await readPage(path);
		assert.deepEqual(languageAlternates(html), expected);
	}
});

test("Every paired static page family publishes language alternates", async () => {
	for (const route of ["/", "/posts/", "/tags/", "/showcase/"]) {
		const expected = [
			["en", `${siteOrigin}${basePath}${route}`],
			["zh-CN", `${siteOrigin}${basePath}/zh${route}`],
			["x-default", `${siteOrigin}${basePath}${route}`],
		];

		for (const localizedRoute of [route, `/zh${route}`]) {
			const html = await readPage(localizedRoute);
			assert.deepEqual(languageAlternates(html), expected, localizedRoute);
		}
	}
});

test("The sitemap groups localized Showcase URLs", async () => {
	const sitemap = await readFile(new URL("../dist/sitemap-0.xml", import.meta.url), "utf8");
	const englishUrl = `${siteOrigin}${basePath}/showcase/`;
	const chineseUrl = `${siteOrigin}${basePath}/zh/showcase/`;

	for (const pageUrl of [englishUrl, chineseUrl]) {
		const entry = sitemap.match(new RegExp(`<url><loc>${pageUrl}</loc>(.*?)</url>`))?.[1];
		assert.ok(entry, `missing sitemap entry for ${pageUrl}`);
		assert.match(entry, new RegExp(`<xhtml:link[^>]+hreflang="en"[^>]+href="${englishUrl}"`));
		assert.match(entry, new RegExp(`<xhtml:link[^>]+hreflang="zh-CN"[^>]+href="${chineseUrl}"`));
	}
});

test("Showcase routes preserve localized content, navigation, and canonical URLs", async () => {
	const cases = [
		{
			path: "/showcase/",
			navigationHref: `${basePath}/showcase/`,
			canonicalHref: `${siteOrigin}${basePath}/showcase/`,
			text: "A handful of projects I've built.",
		},
		{
			path: "/zh/showcase/",
			navigationHref: `${basePath}/zh/showcase/`,
			canonicalHref: `${siteOrigin}${basePath}/zh/showcase/`,
			text: "我开发的一些项目。",
		},
	];

	for (const { path, navigationHref, canonicalHref, text } of cases) {
		const html = await readPage(path);
		const links = linkAttributes(html);
		const navigationLinks = elementAttributes(html, "a");
		assert.ok(
			navigationLinks.some(({ href }) => href === navigationHref),
			`${path} navigation`,
		);
		assert.ok(
			links.some(({ href, rel }) => href === canonicalHref && rel === "canonical"),
			`${path} canonical`,
		);
		assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
});

test("Pages without a translation do not advertise nonexistent alternates", async () => {
	const html = await readPage("/about/");
	assert.deepEqual(languageAlternates(html), []);
});

test("Home pages report the total number of Showcase projects", async () => {
	const englishHome = await readPage("/");
	const chineseHome = await readPage("/zh/");

	assert.match(englishHome, /View all 3 projects →/);
	assert.match(chineseHome, /查看全部 3 个项目 →/);
});
