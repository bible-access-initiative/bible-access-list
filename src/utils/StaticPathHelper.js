import { SITE } from "../config.js";

export function LocalePath() {
	return Object.keys(SITE.locales).map((locale) => ({
		params: { locale },
	}));
}

export async function MdPathFetch(pages) {
	const locales = Object.keys(SITE.locales);

	const page = pages.filter((mdPage) =>
		locales.some((locale) => {
			return mdPage.file.includes(locale);
		}),
	);

	return page.map((content) => ({
		params: {
			locale: content.frontmatter.locale,
		},
		props: {
			content,
		},
	}));
}

export async function NestedResourcePath(type, id = "id", locale = true) {
	let data = await fetch(`${SITE.apiLiveUrl}/${type}/index.json`).then((response) =>
		response.json(),
	);

	if (scope !== "all") {
		switch (type) {
			case "scriptures":
				//data = data.filter(bible => bible.ci == scope)
				break;
			case "organizations":
			case "countries":
				data = [];
				break;
			case "languages":
				if(scope !== "all") {
					data = data.filter((language) => language.ci === scope);
				}
				break;
			default:
				break;
		}
	}

	const returns = [];
	const locales = Object.keys(SITE.locales);

	if (locale === false) {
		returns.push(
			data.map((item) => {
				return { params: { id: item[id] } };
			}),
		);
	}

	for (let i = 0; i < locales.length; i++) {
		const locale = locales[i];
		returns.push(
			data.map((item) => {
				return { params: { id: item[id], locale: locale } };
			}),
		);
	}

	return [].concat.apply([], returns);
}
