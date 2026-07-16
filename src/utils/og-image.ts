import type { Locale } from "@/i18n/config";
import { formatBylineDate, formatEyebrowDate, formatReadingTime } from "@/utils/date";

const separator = " · ";

interface ArticleOgInput {
	authorName?: string;
	host: string;
	locale: Locale;
	pubDate: Date;
	readingTime: string;
	tags: string[];
	title: string;
}

export interface ArticleOgContent {
	byline: string;
	eyebrow: string;
	fontFamily: "Maple Mono CN" | "Newsreader";
	host: string;
	htmlLang: "en" | "zh-CN";
	metadataFontFamily: "Maple Mono" | "Maple Mono CN";
	tagsLine: string;
	title: string;
	titleWeight: 400 | 600;
}

/**
 * Keeps locale copy and typography decisions out of the rendering template.
 * The template consumes one stable shape regardless of language.
 */
export function createArticleOgContent(input: ArticleOgInput): ArticleOgContent {
	const isChinese = input.locale === "zh";
	const bylineParts = [
		input.authorName ? `${isChinese ? "作者" : "By"} ${input.authorName}` : null,
		formatBylineDate(input.pubDate, input.locale),
		formatReadingTime(input.readingTime, input.locale),
	].filter(Boolean) as string[];

	return {
		byline: bylineParts.join(separator),
		eyebrow: `${isChinese ? "文章" : "Posts"}${separator}${formatEyebrowDate(input.pubDate, input.locale)}`,
		fontFamily: isChinese ? "Maple Mono CN" : "Newsreader",
		host: input.host,
		htmlLang: isChinese ? "zh-CN" : "en",
		metadataFontFamily: isChinese ? "Maple Mono CN" : "Maple Mono",
		tagsLine: input.tags.join(separator),
		title: input.title,
		titleWeight: isChinese ? 400 : 600,
	};
}
