import type { ServiceSchema } from "moleculer";
import ApiGateway from "moleculer-web";
import { signSession, verifySession } from "../utils/session";
import { parseCookies, buildCookie } from "../utils/cookies";
import { sendJSON, sendText } from "../utils/http";

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3000";
const COOKIE_NAME = process.env.SESSION_COOKIE || "sess";
const ONE_WEEK = 60 * 60 * 24 * 7;

function requireSession(req: any, res: any, ctx: any) {
	try {
		const secret = process.env.SESSION_SECRET;
		if (!secret) {
			sendJSON(res, 500, { ok: false, error: "SESSION_SECRET missing" });
			return undefined;
		}

		const token = parseCookies(req)[COOKIE_NAME];
		if (!token) {
			sendJSON(res, 401, { ok: false, error: "No session" });
			return undefined;
		}

		const payload = verifySession(token, secret);
		if (!payload) {
			sendJSON(res, 401, { ok: false, error: "Invalid/expired session" });
			return undefined;
		}

		return payload;
	} catch (e) {
		ctx.broker.logger.error(e);
		sendJSON(res, 500, { ok: false, error: "Internal error" });
		return undefined;
	}
}

function hasAction(ctx: any, name: string) {
	try {
		return !!ctx?.broker?.registry?.hasAction?.(name, true);
	} catch {
		return false;
	}
}

const ApiService: ServiceSchema = {
	name: "api",
	mixins: [ApiGateway],
	settings: {
		port: Number(process.env.PORT || 8080),

		dependencies: ["search", "openLibrary", "library"],

		bodyParsers: {
			json: { strict: false, limit: "1mb" },
			urlencoded: { extended: true, limit: "1mb" },
		},

		cors: {
			origin: [FRONT_ORIGIN],
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type"],
			credentials: true,
			maxAge: 86400,
		},

		routes: [
			{
				path: "/api",
				cors: {
					origin: [FRONT_ORIGIN],
					methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
					allowedHeaders: ["Content-Type"],
					credentials: true,
					maxAge: 86400,
				},
				mappingPolicy: "restrict",
				whitelist: [],
				autoAliases: false,

				aliases: {
					// ============ AUTH ============
					// POST /api/auth/login
					"POST auth/login"(req: any, res: any, ctx: any) {
						try {
							const { username, password } = req.body || {};
							if (username === process.env.BASIC_USER && password === process.env.BASIC_PASS) {
								const token = signSession(username, process.env.SESSION_SECRET!, ONE_WEEK);
								const attrs = [
									`${COOKIE_NAME}=${encodeURIComponent(token)}`,
									"Path=/",
									"HttpOnly",
									"SameSite=Lax",
									`Max-Age=${ONE_WEEK}`,
								];
								if (process.env.NODE_ENV === "production") attrs.push("Secure");
								res.setHeader("Set-Cookie", attrs.join("; "));
								return sendJSON(res, 200, { ok: true, user: { username } }); // ← CIERRA RESPUESTA
							}
							return sendJSON(res, 401, { ok: false, error: "Invalid credentials" });
						} catch (err) {
							ctx.broker.logger.error(err);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					"GET auth/me"(req: any, res: any, ctx: any) {
						try {
							const cookies = parseCookies(req);
							const token = cookies[COOKIE_NAME];
							if (!token) return sendJSON(res, 401, { ok: false, error: "No session" });
							const payload = verifySession(token, process.env.SESSION_SECRET!);
							if (!payload) return sendJSON(res, 401, { ok: false, error: "Invalid/expired session" });
							return sendJSON(res, 200, { ok: true, user: { username: payload.sub } });
						} catch (err) {
							ctx.broker.logger.error(err);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// ============ BOOK SEARCH ============
					// GET /api/books/search?q=
					"GET books/search": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx; // contexto de Moleculer para este request
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const q = String(req.$params?.q ?? "").trim();

							let itemsIn: any[] = [];
							try {
								const r: any = await $ctx.broker.call(
									"openLibrary.search",
									{ q },
									{ meta: $ctx?.meta } // propaga meta si lo necesitás
								);
								itemsIn = Array.isArray(r?.items) ? r.items : [];
							} catch {
								itemsIn = [];
							}

							const items = await Promise.all(
								itemsIn.map(async (it: any) => {
									let localId: string | null = null;
									try {
										localId = await $ctx.broker.call("library.findByOlKey", { ol_key: it.ol_key }, { meta: $ctx?.meta });
									} catch {
										/* noop */
									}
									return {
										...it,
										coverUrl: localId ? `/api/books/library/front-cover/${localId}` : it.coverUrl,
									};
								})
							);

							if (q) {
								try {
									await $ctx.broker.call("search.push", { userKey: payload.sub, query: q }, { meta: $ctx?.meta });
								} catch {
									/* noop */
								}
							}

							return sendJSON(res, 200, { total: items.length, items });
						} catch (e) {
							req.$ctx?.broker.logger.error("GET /api/books/search error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// ============ LAST SEARCHES ============
					// GET /api/books/last-search
					"GET books/last-search": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const searches = await $ctx.broker.call("search.last5", { userKey: payload.sub }, { meta: $ctx?.meta });
							return sendJSON(res, 200, { searches: searches || [] });
						} catch (e) {
							req.$ctx?.broker.logger.error("GET /api/books/last-search error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// ============ GET BOOK BY KEY ============
					// GET /api/books/by-key/:ol_key
					"GET books/by-key/:ol_key": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const ol_key = decodeURIComponent(req.$params.ol_key);

							if (!ol_key || ol_key === "unknown") {
								return sendJSON(res, 400, { ok: false, error: "Invalid or missing ol_key" });
							}

							const bookData = await $ctx.broker.call("openLibrary.getByKey", { ol_key }, { meta: $ctx?.meta });

							if (!bookData) {
								return sendJSON(res, 404, { ok: false, error: "Book not found" });
							}

							// Verificar si el libro ya está en la biblioteca del usuario
							let localId: string | null = null;
							try {
								localId = await $ctx.broker.call("library.findByOlKey", { ol_key }, { meta: $ctx?.meta });
								if (localId) {
									// Si está en biblioteca, usar la portada local
									bookData.coverUrl = `/api/books/library/front-cover/${localId}`;
								}
							} catch {
								// No está en biblioteca, usar portada de OpenLibrary
							}

							return sendJSON(res, 200, { ok: true, book: bookData });
						} catch (e) {
							req.$ctx?.broker.logger.error("GET /api/books/by-key error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// ============ MY LIBRARY ============
					// GET /api/books/my-library
					"GET books/my-library": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const { q, sort, withReview, page, limit } = req.$params;
							const result = await $ctx.broker.call(
								"library.list",
								{
									q,
									sort,
									withReview,
									page,
									limit,
								},
								{ meta: $ctx?.meta }
							);

							return sendJSON(res, 200, result);
						} catch (e) {
							req.$ctx?.broker.logger.error("GET /api/books/my-library error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// GET /api/books/my-library/:id
					"GET books/my-library/:id": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const id = req.$params.id;
							const book = await $ctx.broker.call("library.get", { id }, { meta: $ctx?.meta });
							return sendJSON(res, 200, book);
						} catch (e) {
							if (e instanceof Error && e.message === "Not found") {
								return sendJSON(res, 404, { ok: false, error: "Book not found" });
							}
							req.$ctx?.broker.logger.error("GET /api/books/my-library/:id error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// POST /api/books/my-library
					"POST books/my-library": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const { ol_key, title, author, year, review, rating, coverId, coverUrl } = req.body;

							if (!ol_key || !title || !author) {
								return sendJSON(res, 400, { ok: false, error: "Missing required fields: ol_key, title, author" });
							}

							const book = await $ctx.broker.call(
								"library.save",
								{
									ol_key,
									title,
									author,
									year,
									review,
									rating,
									coverId,
									coverUrl,
								},
								{ meta: $ctx?.meta }
							);

							return sendJSON(res, 201, { ok: true, book });
						} catch (e) {
							req.$ctx?.broker.logger.error("POST /api/books/my-library error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// PUT /api/books/my-library/:id
					"PUT books/my-library/:id": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const id = req.$params.id;
							const { review, rating } = req.body;

							const book = await $ctx.broker.call(
								"library.update",
								{
									id,
									review,
									rating,
								},
								{ meta: $ctx?.meta }
							);

							return sendJSON(res, 200, { ok: true, book });
						} catch (e) {
							if (e instanceof Error && e.message === "Not found") {
								return sendJSON(res, 404, { ok: false, error: "Book not found" });
							}
							req.$ctx?.broker.logger.error("PUT /api/books/my-library/:id error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// DELETE /api/books/my-library/:id
					"DELETE books/my-library/:id": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const id = req.$params.id;
							const result = await $ctx.broker.call("library.remove", { id }, { meta: $ctx?.meta });

							if (!result.ok) {
								return sendJSON(res, 404, { ok: false, error: "Book not found" });
							}

							return sendJSON(res, 200, { ok: true, message: "Book deleted successfully" });
						} catch (e) {
							req.$ctx?.broker.logger.error("DELETE /api/books/my-library/:id error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// DEBUG endpoint - remover después
					"GET books/debug": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const books = await $ctx.broker.call("library.list", { limit: 10 }, { meta: $ctx?.meta });
							const booksWithCoverInfo = books.items.map((book: any) => ({
								_id: book._id,
								title: book.title,
								author: book.author,
								ol_key: book.ol_key,
								hasCover: !!book.coverBase64,
								coverLength: book.coverBase64?.length || 0,
								coverStart: book.coverBase64 ? book.coverBase64.substring(0, 50) : null,
							}));

							return sendJSON(res, 200, { books: booksWithCoverInfo });
						} catch (e) {
							req.$ctx?.broker.logger.error("DEBUG endpoint error:", e);
							return sendJSON(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// GET /api/books/library/front-cover/:id
					"GET books/library/front-cover/:id": async function (req: any, res: any) {
						try {
							const $ctx = req.$ctx;
							const payload = requireSession(req, res, $ctx);
							if (!payload) return;

							const id = req.$params.id;
							const coverBase64 = await $ctx.broker.call("library.cover", { id }, { meta: $ctx?.meta });

							let base64Data: string;
							let contentType = "image/jpeg";

							if (coverBase64.startsWith("data:")) {
								const [header, data] = coverBase64.split(",");
								base64Data = data;
								const mimeMatch = header.match(/data:([^;]+)/);
								if (mimeMatch) {
									contentType = mimeMatch[1];
								}
							} else {
								base64Data = coverBase64;
							}

							const buffer = Buffer.from(base64Data, "base64");
							res.setHeader("Content-Type", contentType);
							res.setHeader("Content-Length", buffer.length);
							res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
							return res.end(buffer);
						} catch (e) {
							if (e instanceof Error && e.message === "Cover not found") {
								res.statusCode = 404;
								res.setHeader("Content-Type", "text/plain");
								return res.end("Cover not found");
							}
							req.$ctx?.broker.logger.error("GET /api/books/library/front-cover/:id error:", e);
							res.statusCode = 500;
							res.setHeader("Content-Type", "text/plain");
							return res.end("Internal error");
						}
					},
				},
				onBeforeCall(this: any, ctx: any, route: any, req: any, res: any) {
					// marca de tiempo y log de entrada
					req.$t0 = process.hrtime.bigint();
					ctx.broker.logger.info({ method: req.method, url: req.url }, "→ req");
				},
				onAfterCall(this: any, ctx: any, route: any, req: any, res: any, data: any) {
					// si no hay statusCode (porque respondiste manual), intenta leerlo igual
					const t0 = req.$t0 as bigint | undefined;
					const durMs = t0 ? Number(process.hrtime.bigint() - t0) / 1e6 : undefined;
					ctx.broker.logger.info({ status: res.statusCode, url: req.url, durationMs: durMs?.toFixed(2) }, "← res");
					return data; // devolver data intacta si no respondiste manualmente
				},
				onError(req: any, res: any, err: any) {
					if (res.headersSent) return; // <- clave
					const body = JSON.stringify({ ok: false, error: err?.message || "Internal error" });
					res.statusCode = Number.isInteger(err?.code) ? err.code : 500;
					res.setHeader("Content-Type", "application/json; charset=utf-8");
					res.setHeader("Content-Length", Buffer.byteLength(body));
					res.end(body);
				},
			},
		],
	},
};

export default ApiService;
