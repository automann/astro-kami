import { defaultLocale, type Locale, localeMeta } from "@/i18n/config";
import { siteConfig } from "@/site-config";

const dateFormat = new Intl.DateTimeFormat(siteConfig.date.locale, siteConfig.date.options);

const localeDate = (locale: Locale, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat(localeMeta[locale].dateLocale, options);

export function getFormattedDate(
	date: string | number | Date,
	options?: Intl.DateTimeFormatOptions,
): string {
	if (typeof options !== "undefined") {
		return new Date(date).toLocaleDateString(siteConfig.date.locale, {
			...(siteConfig.date.options as Intl.DateTimeFormatOptions),
			...options,
		});
	}

	return dateFormat.format(new Date(date));
}

/** Short rail date: `5 Mar 2026`. */
export function formatRailDate(date: Date, locale: Locale = defaultLocale): string {
	return localeDate(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Featured-card stamp: `March 2026`. */
export function formatStampDate(date: Date, locale: Locale = defaultLocale): string {
	return localeDate(locale, { month: "long", year: "numeric" }).format(date);
}

/** Article byline date: `5 March 2026`. */
export function formatBylineDate(date: Date, locale: Locale = defaultLocale): string {
	return localeDate(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** Article eyebrow date: `March 2026`. */
export function formatEyebrowDate(date: Date, locale: Locale = defaultLocale): string {
	return localeDate(locale, { month: "long", year: "numeric" }).format(date);
}

/** Reading-time text emitted by the Markdown remark plugin. */
export function formatReadingTime(readingTime: string, locale: Locale = defaultLocale): string {
	return locale === "zh" ? readingTime.replace(/([\d.]+)\s*min read/i, "$1 分钟阅读") : readingTime;
}
