import type { ServiceSchema } from "moleculer";
import axios from "axios";

interface OLItem {
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
	key: string;
}

const OpenLibraryService: ServiceSchema = {
	name: "openLibrary",
	actions: {
		search: {
			params: {
				q: "string",
			},
			async handler(ctx) {
				const q = String(ctx.params.q || "").trim();
				ctx.broker.logger.info({ q }, "Buscando en OpenLibrary");

				if (q.length < 2) return { total: 0, items: [] };

				try {
					const { data } = await axios.get("https://openlibrary.org/search.json", {
						params: { q, limit: 10 },
						timeout: 8000,
					});

					const docs: OLItem[] = data.docs || [];
					const items = docs.slice(0, 10).map((d) => ({
						ol_key: d.key,
						title: d.title,
						author: d.author_name?.[0] || "Autor desconocido",
						year: d.first_publish_year || null,
						coverId: d.cover_i || null,
						coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
					}));

					return { total: items.length, items };
				} catch (error) {
					ctx.broker.logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error buscando en OpenLibrary");
					return { total: 0, items: [] };
				}
			},
		},
	},
};

export default OpenLibraryService;
