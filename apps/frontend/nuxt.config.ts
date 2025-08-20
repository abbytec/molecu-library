// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	ssr: false,
	modules: ["@pinia/nuxt"],
	css: ["@/assets/styles/main.scss"],
	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/styles/variables" as *;',
				},
			},
		},
	},
	devServer: {
		port: 3001,
	},
	runtimeConfig: {
		public: {
			apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:8181/api",
		},
	},
});
