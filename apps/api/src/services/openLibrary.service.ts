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

		getByKey: {
			params: {
				ol_key: "string",
			},
			async handler(ctx) {
				const ol_key = String(ctx.params.ol_key || "").trim();
				ctx.broker.logger.info({ ol_key }, "Obteniendo libro por key desde OpenLibrary");

				if (!ol_key) return null;

				try {
					// Intentar obtener directamente por key
					const { data } = await axios.get(`https://openlibrary.org${ol_key}.json`, {
						timeout: 8000,
					});

					// Si es un work, también necesitamos información adicional
					let authors = [];
					if (data.authors && Array.isArray(data.authors)) {
						// Obtener nombres de autores
						for (const author of data.authors.slice(0, 3)) {
							// máximo 3 autores
							try {
								if (author.author && author.author.key) {
									const authorRes = await axios.get(`https://openlibrary.org${author.author.key}.json`, {
										timeout: 5000,
									});
									if (authorRes.data.name) {
										authors.push(authorRes.data.name);
									}
								}
							} catch {
								// Si falla obtener autor, continuar
							}
						}
					}

					// Buscar cover
					let coverId = null;
					let coverUrl = null;
					if (data.covers && Array.isArray(data.covers) && data.covers[0]) {
						coverId = data.covers[0];
						coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
					}

					// Extraer año de publicación
					let year = null;
					if (data.first_publish_date) {
						const yearMatch = data.first_publish_date.match(/\d{4}/);
						year = yearMatch ? parseInt(yearMatch[0]) : null;
					}

					const bookData = {
						ol_key: ol_key,
						title: data.title || "Título desconocido",
						author: authors.length > 0 ? authors.join(", ") : "Autor desconocido",
						year: year,
						coverId: coverId,
						coverUrl: coverUrl,
					};

					ctx.broker.logger.info({ bookData }, "Libro obtenido exitosamente");
					return bookData;
				} catch (error) {
					ctx.broker.logger.error(
						{ error: error instanceof Error ? error.message : String(error), ol_key },
						"Error obteniendo libro por key desde OpenLibrary"
					);
					return null;
				}
			},
		},
	},
};

export default OpenLibraryService;
