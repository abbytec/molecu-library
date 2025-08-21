// stores/useAuthStore.ts
export const useAuthStore = defineStore("auth", {
	state: () => ({
		ok: false,
		username: null as string | null,
		credential: null as string | null,
		ready: false,
	}),

	getters: {
		// Genera el header Authorization para Basic Auth
		authHeader(): string | null {
			if (!this.username || !this.credential) return null;
			return `Basic ${this.credential}`;
		},

		// Headers para requests autenticadas
		authHeaders(): Record<string, string> {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (this.authHeader) {
				headers["Authorization"] = this.authHeader;
			}
			return headers;
		},
	},

	actions: {
		// Cargar credenciales persistidas del localStorage
		loadPersistedCredentials() {
			if (import.meta.client) {
				try {
					const stored = localStorage.getItem("auth-credentials");
					if (stored) {
						const { username, credential } = JSON.parse(stored);
						if (username && credential) {
							this.username = username;
							this.credential = credential;
						}
					}
				} catch (e) {
					console.warn("Error loading persisted credentials:", e);
				}
			}
		},

		// Persistir credenciales en localStorage
		persistCredentials() {
			if (import.meta.client && this.username && this.credential) {
				try {
					localStorage.setItem(
						"auth-credentials",
						JSON.stringify({
							username: this.username,
							credential: this.credential,
						})
					);
				} catch (e) {
					console.warn("Error persisting credentials:", e);
				}
			}
		},

		// Limpiar credenciales persistidas
		clearPersistedCredentials() {
			if (import.meta.client) {
				try {
					localStorage.removeItem("auth-credentials");
				} catch (e) {
					console.warn("Error clearing persisted credentials:", e);
				}
			}
		},

		async me(apiBase: string, throwOnError: boolean = false) {
			try {
				if (!this.username || !this.credential) {
					this.loadPersistedCredentials();
				}

				if (!this.authHeader) {
					this.ok = false;
					this.ready = true;
					return false;
				}

				const res = await $fetch<{ ok: boolean; user?: { username: string } }>(`${apiBase}/auth/me`, {
					headers: this.authHeaders,
				});

				this.ok = !!res.ok;
				if (!res.ok) {
					this.clearCredentials();
				}
			} catch (error: any) {
				// Si el backend dice 401 (credenciales inválidas/ausentes), reseteamos
				if (error?.data?.status === 401 || error?.status === 401 || error?.statusCode === 401) {
					this.clearCredentials();
				} else if (throwOnError) {
					throw error;
				}
				this.ok = false;
			} finally {
				this.ready = true;
			}
			return this.ok;
		},

		async login(apiBase: string, u: string, p: string) {
			const credentials = btoa(`${u}:${p}`);
			const authHeader = `Basic ${credentials}`;

			const res = await $fetch<{ ok: boolean; user?: { username: string } }>(`${apiBase}/auth/me`, {
				headers: {
					Authorization: authHeader,
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				this.ok = true;
				this.username = u;
				this.credential = credentials;
				this.ready = true;
				this.persistCredentials();
			} else {
				throw new Error("Invalid credentials");
			}
		},

		async logout(apiBase: string) {
			try {
				if (this.authHeader) {
					await $fetch(`${apiBase}/auth/logout`, {
						method: "POST",
						headers: this.authHeaders,
					});
				}
			} catch {
				// Ignorar errores del logout
			}
			this.clearCredentials();
		},

		clearCredentials() {
			this.ok = false;
			this.username = null;
			this.credential = null;
			this.clearPersistedCredentials();
		},

		// Resetear el store completamente
		$reset() {
			this.clearCredentials();
			this.ready = false;
		},
	},
});
