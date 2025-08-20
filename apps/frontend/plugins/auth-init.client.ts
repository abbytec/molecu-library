import { useAuthStore } from "@/stores/useAuthStore";
export default defineNuxtPlugin(async () => {
	const {
		public: { apiBase },
	} = useRuntimeConfig();
	const auth = useAuthStore();
	if (!auth.ready) await auth.me(apiBase);
});
