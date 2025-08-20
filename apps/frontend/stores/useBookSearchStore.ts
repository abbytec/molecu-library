export const useBookSearchStore = defineStore("bookSearch", {
	state: () => ({
		// Estado de búsqueda
		searchQuery: "",
		searchResults: [] as any[],
		isSearching: false,
		hasSearched: false,

		// Búsquedas recientes
		recentSearches: [] as string[],

		// Estado de navegación
		canGoBack: false,

		// Cache de imágenes (URL -> { data: base64/url, timestamp: number })
		imageCache: new Map() as Map<string, { data: string; timestamp: number }>,
	}),

	actions: {
		async performSearch(query: string) {
			if (!query.trim()) return;

			this.isSearching = true;
			this.hasSearched = true;
			this.searchQuery = query;

			try {
				const { get } = useApi();
				const response = await get<{ total: number; items: any[] }>(`/books/search?q=${encodeURIComponent(query)}`);

				// Limitar a máximo 10 resultados
				let results = response.items.slice(0, 10);

				// Procesar imágenes con cache
				results = await this.processImagesWithCache(results);

				this.searchResults = results;

				// Actualizar búsquedas recientes
				if (!this.recentSearches.includes(query)) {
					this.recentSearches.unshift(query);
					// Mantener solo las últimas 5
					this.recentSearches = this.recentSearches.slice(0, 5);
				}

				this.canGoBack = false; // No hay necesidad de volver después de una búsqueda nueva

				// Limpiar cache expirado
				this.cleanExpiredCache();
			} catch (error) {
				console.error("Error en la búsqueda:", error);
				this.searchResults = [];
			} finally {
				this.isSearching = false;
			}
		},

		// Procesar imágenes con sistema de cache
		async processImagesWithCache(items: any[]) {
			const processedItems = await Promise.all(
				items.map(async (item) => {
					if (!item.coverUrl) return item;

					// Verificar si la imagen está en cache
					const cachedImage = this.getCachedImage(item.coverUrl);
					if (cachedImage) {
						return {
							...item,
							coverUrl: cachedImage,
						};
					}

					// Si no está en cache, intentar cargar y cachear
					try {
						// Crear una promesa para cargar la imagen
						const imagePromise = new Promise<string>((resolve, reject) => {
							const img = new Image();
							img.crossOrigin = "anonymous";
							img.onload = () => {
								try {
									const canvas = document.createElement("canvas");
									const ctx = canvas.getContext("2d");
									canvas.width = img.width;
									canvas.height = img.height;
									ctx?.drawImage(img, 0, 0);
									const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
									resolve(dataUrl);
								} catch (error) {
									resolve(item.coverUrl); // Fallback a URL original
								}
							};
							img.onerror = () => resolve(item.coverUrl); // Fallback a URL original
							img.src = item.coverUrl;
						});

						// Timeout para no bloquear la UI
						const timeoutPromise = new Promise<string>((resolve) => {
							setTimeout(() => resolve(item.coverUrl), 2000);
						});

						const result = await Promise.race([imagePromise, timeoutPromise]);

						// Guardar en cache solo si es diferente a la URL original
						if (result !== item.coverUrl) {
							this.setCachedImage(item.coverUrl, result);
						}

						return {
							...item,
							coverUrl: result,
						};
					} catch (error) {
						console.error("Error al procesar la imagen:", error);
						return item;
					}
				})
			);

			return processedItems;
		},

		setCanGoBack(value: boolean) {
			this.canGoBack = value;
		},

		clearSearch() {
			this.searchQuery = "";
			this.searchResults = [];
			this.hasSearched = false;
			this.canGoBack = false;
		},

		// Cargar búsquedas recientes desde la API
		async loadRecentSearches() {
			try {
				const { get } = useApi();
				const response = await get<{ searches: string[] }>("/books/last-search");
				this.recentSearches = response.searches || [];
			} catch (error) {
				console.error("Error cargando búsquedas recientes:", error);
			}
		},

		// Cache de imágenes (1 minuto de duración)
		getCachedImage(url: string): string | null {
			const CACHE_DURATION = 60 * 1000; // 1 minuto
			const cached = this.imageCache.get(url);

			if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
				return cached.data;
			}

			// Si está expirado, eliminarlo
			if (cached) {
				this.imageCache.delete(url);
			}

			return null;
		},

		setCachedImage(url: string, data: string) {
			this.imageCache.set(url, {
				data,
				timestamp: Date.now(),
			});
		},

		// Limpiar cache expirado
		cleanExpiredCache() {
			const CACHE_DURATION = 60 * 1000; // 1 minuto
			const now = Date.now();

			for (const [url, cached] of this.imageCache.entries()) {
				if (now - cached.timestamp >= CACHE_DURATION) {
					this.imageCache.delete(url);
				}
			}
		},
	},

	getters: {
		hasResults: (state) => state.searchResults.length > 0,
		resultsCount: (state) => state.searchResults.length,
	},
});
