export function parseCookies(req: any): Record<string, string> {
	const raw = (req.headers.cookie || "").split(";").map((s: string) => s.trim());
	const out: Record<string, string> = {};
	for (const c of raw) {
		const i = c.indexOf("=");
		if (i > -1) out[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1));
	}
	return out;
}

export function buildCookie(name: string, value: string, attrs: string[]) {
	return `${name}=${encodeURIComponent(value)}; ${attrs.join("; ")}`;
}
