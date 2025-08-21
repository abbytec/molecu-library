export function useApi() {
	const config = useRuntimeConfig();
	const base = config.public.apiBase;
	const authStore = useAuthStore();

	async function post<T>(url: string, body: any): Promise<T> {
		const headers: Record<string, string> = { "Content-Type": "application/json" };

		// Agregar header de autenticación si está disponible
		if (authStore.authHeader) {
			headers["Authorization"] = authStore.authHeader;
		}

		const res = await fetch(`${base}${url}`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const errorText = await res.text();
			const error = new Error(errorText || `HTTP ${res.status}`);
			(error as any).status = res.status;
			(error as any).statusCode = res.status;
			throw error;
		}
		return res.json();
	}

	async function get<T>(url: string): Promise<T> {
		const headers: Record<string, string> = {};

		// Agregar header de autenticación si está disponible
		if (authStore.authHeader) {
			headers["Authorization"] = authStore.authHeader;
		}

		const res = await fetch(`${base}${url}`, {
			headers: Object.keys(headers).length > 0 ? headers : undefined,
		});

		if (!res.ok) {
			const errorText = await res.text();
			const error = new Error(errorText || `HTTP ${res.status}`);
			(error as any).status = res.status;
			(error as any).statusCode = res.status;
			throw error;
		}
		return res.json();
	}

	return { get, post };
}
