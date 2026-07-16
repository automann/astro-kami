import { render } from "astro:content";
import { loadMapleMonoCnRegular } from "@automann/maple-mono-cn/og-cn";
import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import { html } from "satori-html";
import MapleMono from "@/assets/fonts/maplemono-regular.ttf";
import NewsreaderItalic from "@/assets/fonts/newsreader-italic.ttf";
import NewsreaderRegular from "@/assets/fonts/newsreader-regular.ttf";
import NewsreaderSemiBold from "@/assets/fonts/newsreader-semibold.ttf";
import { getAllPosts } from "@/data/post";
import { type Locale, postLocaleFromId } from "@/i18n/config";
import { siteConfig } from "@/site-config";
import { type ArticleOgContent, createArticleOgContent } from "@/utils/og-image";

const englishFonts: SatoriOptions["fonts"] = [
	{ data: Buffer.from(NewsreaderRegular), name: "Newsreader", style: "normal", weight: 400 },
	{ data: Buffer.from(NewsreaderSemiBold), name: "Newsreader", style: "normal", weight: 600 },
	{ data: Buffer.from(NewsreaderItalic), name: "Newsreader", style: "italic", weight: 400 },
	{ data: Buffer.from(MapleMono), name: "Maple Mono", style: "normal", weight: 400 },
];

const ogOptions = async (locale: Locale): Promise<SatoriOptions> => ({
	fonts:
		locale === "zh"
			? [
					{
						data: await loadMapleMonoCnRegular(),
						name: "Maple Mono CN",
						style: "normal",
						weight: 400,
					},
				]
			: englishFonts,
	height: 630,
	width: 1200,
});

const titleClass = (title: string) =>
	title.length > 80
		? "text-5xl leading-tight mb-10"
		: title.length > 55
			? "text-6xl leading-tight mb-10"
			: "text-7xl leading-tight mb-10";

const markup = (props: ArticleOgContent) =>
	html`<div lang="${props.htmlLang}" tw="flex flex-col w-full h-full px-20 py-16" style="background-color: #1a1715; font-family: ${props.fontFamily};">
		<p tw="text-2xl mb-10 tracking-widest uppercase" style="font-family: ${props.metadataFontFamily}; color: #c89761;">
			${props.eyebrow}
		</p>
		<h1 tw="${titleClass(props.title)}" style="color: #fbf6ec; font-weight: ${props.titleWeight};">
			${props.title}
		</h1>
		<p tw="text-2xl mb-4" style="font-family: ${props.metadataFontFamily}; color: #a89c8a;">
			${props.byline}
		</p>
		<p tw="text-xl tracking-wider uppercase" style="font-family: ${props.metadataFontFamily}; color: #c89761;">
			${props.tagsLine}
		</p>
		<div tw="flex flex-1"></div>
		<div tw="flex justify-end w-full">
			<p tw="text-lg tracking-wide" style="font-family: ${props.metadataFontFamily}; color: #6b5e4f;">
				${props.host}
			</p>
		</div>
	</div>`;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { locale, pubDate, title, tags, readingTime } = context.props as Props;

	const date = new Date(pubDate);
	const authorName = siteConfig.profile?.name ?? siteConfig.author;
	const host = context.site ? new URL(context.site).host : siteConfig.title;

	const svg = await satori(
		markup(
			createArticleOgContent({
				authorName,
				host,
				locale,
				pubDate: date,
				readingTime,
				tags,
				title,
			}),
		),
		await ogOptions(locale),
	);
	const png = new Resvg(svg).render().asPng();
	return new Response(new Uint8Array(png), {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	const filtered = posts.filter(({ data }) => !data.ogImage);
	const items = await Promise.all(
		filtered.map(async (post) => {
			const { remarkPluginFrontmatter } = await render(post);
			const readingTime = (remarkPluginFrontmatter as { minutesRead?: string })?.minutesRead ?? "";
			return {
				params: { slug: post.id },
				props: {
					locale: postLocaleFromId(post.id),
					pubDate: (post.data.updatedDate ?? post.data.publishDate).toISOString(),
					title: post.data.title,
					tags: post.data.tags ?? [],
					readingTime,
				},
			};
		}),
	);
	return items;
}
