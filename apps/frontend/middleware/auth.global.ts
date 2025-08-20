import { useAuthStore } from "~/stores/useAuthStore";

export default defineNuxtRouteMiddleware(async (to) => {
	const config = useRuntimeConfig();
	const store = useAuthStore();

	if (to.path !== "/") {
		if (!store.ok || !store.ready) {
			const ok = await store.me(config.public.apiBase);
			if (!ok) return navigateTo("/", { replace: true });
		}
	}
});
