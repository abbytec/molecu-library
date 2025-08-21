import { useAuthStore } from "@/stores/useAuthStore";

export default defineNuxtPlugin(async () => {
	const {
		public: { apiBase },
	} = useRuntimeConfig();
	const auth = useAuthStore();

	auth.loadPersistedCredentials();

	// Solo verificar autenticación si tenemos credenciales
	if (!auth.ready && auth.username && auth.credential) {
		try {
			await auth.me(apiBase);
		} catch (error) {
			// Ignorar errores en la inicialización, el middleware se encargará
			console.warn("Auth init: Error verifying credentials, will retry later:", error);
		}
	} else {
		auth.ready = true;
	}
});
