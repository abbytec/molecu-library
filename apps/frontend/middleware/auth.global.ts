import { useAuthStore } from "~/stores/useAuthStore";

export default defineNuxtRouteMiddleware(async (to) => {
	const config = useRuntimeConfig();
	const store = useAuthStore();

	if (to.path !== "/") {
		if (!store.ok || !store.ready) {
			try {
				const ok = await store.me(config.public.apiBase, true);
				if (!ok) {
					if (!store.username || !store.password) {
						return navigateTo("/", { replace: true });
					}
				}
			} catch (error: any) {
				console.error("Error verifying credentials:", error);
				return navigateTo("/", { replace: true });
			}
		}
	}
});
