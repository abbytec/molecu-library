// src/services/api.service.ts
import type { ServiceSchema } from "moleculer";
import ApiGateway from "moleculer-web";
import { signSession, verifySession } from "../utils/session";

function parseCookies(req: any): Record<string, string> {
	const raw = (req.headers.cookie || "").split(";").map((s: string) => s.trim());
	const out: Record<string, string> = {};
	for (const c of raw) {
		const i = c.indexOf("=");
		if (i > -1) out[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1));
	}
	return out;
}

// ✅ helper: responde JSON y cierra el stream
function json(res: any, status: number, data: any) {
	const body = JSON.stringify(data);
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Content-Length", Buffer.byteLength(body));
	res.end(body);
	return null; // <- importante: ya respondimos
}

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3000";
const COOKIE_NAME = process.env.SESSION_COOKIE || "sess";
const ONE_WEEK = 60 * 60 * 24 * 7;

const ApiService: ServiceSchema = {
	name: "api",
	mixins: [ApiGateway],
	settings: {
		port: Number(process.env.PORT || 8080),

		bodyParsers: {
			json: { strict: false, limit: "1mb" },
			urlencoded: { extended: true, limit: "1mb" },
		},

		cors: {
			origin: [FRONT_ORIGIN],
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
			maxAge: 86400,
		},

		routes: [
			{
				path: "/api",
				cors: {
					origin: [FRONT_ORIGIN],
					methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
					allowedHeaders: ["Content-Type", "Authorization"],
					credentials: true,
					maxAge: 86400,
				},

				aliases: {
					// POST /api/auth/login
					"POST auth/login"(req: any, res: any) {
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
								// En prod HTTPS: attrs.push("Secure");
								res.setHeader("Set-Cookie", attrs.join("; "));
								return json(res, 200, { ok: true, user: { username } });
							}

							return json(res, 401, { ok: false, error: "Invalid credentials" });
						} catch (err) {
							console.error(err);
							return json(res, 500, { ok: false, error: "Internal error" });
						}
					},

					// GET /api/auth/me
					"GET auth/me"(req: any, res: any) {
						try {
							const cookies = parseCookies(req);
							const token = cookies[COOKIE_NAME];
							if (!token) {
								return json(res, 401, { ok: false, error: "No session" });
							}
							const payload = verifySession(token, process.env.SESSION_SECRET!);
							if (!payload) {
								return json(res, 401, { ok: false, error: "Invalid/expired session" });
							}
							return json(res, 200, { ok: true, user: { username: payload.sub } });
						} catch (err) {
							console.error(err);
							return json(res, 500, { ok: false, error: "Internal error" });
						}
					},
				},
			},
		],
	},
};

export default ApiService;
