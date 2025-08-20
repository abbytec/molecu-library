// stores/useAuthStore.ts
export const useAuthStore = defineStore("auth", {
	state: () => ({ ok: false, username: null as string | null, ready: false }),
	actions: {
		async me(apiBase: string) {
			try {
				const res = await $fetch<{ ok: boolean; user?: { username: string } }>(`${apiBase}/auth/me`, { credentials: "include" });
				this.ok = !!res.ok;
				this.username = res.user?.username ?? null;
			} catch {
				// 👇 si el backend dice 401 (cookie inválida/ausente), reseteamos
				this.ok = false;
				this.username = null;
			} finally {
				this.ready = true;
			}
			return this.ok;
		},

		async login(apiBase: string, u: string, p: string) {
			await $fetch(`${apiBase}/auth/login`, {
				method: "POST",
				body: { username: u, password: p },
				credentials: "include",
			});
			this.ok = true;
			this.username = u;
			this.ready = true;
		},

		async logout(apiBase: string) {
			try {
				await $fetch(`${apiBase}/auth/logout`, { method: "POST", credentials: "include" });
			} catch {}
			this.$reset();
		},
	},
});
