import { render } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import MapleMono from "@/assets/fonts/maplemono-regular.ttf";
import NewsreaderItalic from "@/assets/fonts/newsreader-italic.ttf";
import NewsreaderRegular from "@/assets/fonts/newsreader-regular.ttf";
import NewsreaderSemiBold from "@/assets/fonts/newsreader-semibold.ttf";
import {
	articleCardMarkup,
	createArticleCardModel,
	defaultArticleCardFonts,
} from "@/components/og/article-card";
import { getAllPosts } from "@/data/post";
import { postLocaleFromId } from "@/i18n/config";
import { siteConfig } from "@/site-config";

const ogOptions: SatoriOptions = {
	fonts: [
		{ data: Buffer.from(NewsreaderRegular), name: "Newsreader", style: "normal", weight: 400 },
		{ data: Buffer.from(NewsreaderSemiBold), name: "Newsreader", style: "normal", weight: 600 },
		{ data: Buffer.from(NewsreaderItalic), name: "Newsreader", style: "italic", weight: 400 },
		{ data: Buffer.from(MapleMono), name: "Maple Mono", style: "normal", weight: 400 },
	],
	height: 630,
	width: 1200,
};
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { author, description, locale, pubDate, title, tags, readingTime } = context.props as Props;

	const date = new Date(pubDate);
	const host = context.site ? new URL(context.site).host : siteConfig.title;
	const card = createArticleCardModel({
		author,
		description,
		host,
		locale,
		publishDate: date,
		readingTime,
		tags,
		title,
	});

	// The visual template accepts font-family names independently from the
	// Satori font data above. Locale-specific font data can therefore be wired
	// in without changing the card model or layout.
	const svg = await satori(articleCardMarkup(card, defaultArticleCardFonts), ogOptions);
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
			const author = siteConfig.profile?.name ?? siteConfig.author;
			return {
				params: { slug: post.id },
				props: {
					author,
					description: post.data.description,
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
