import { defineStore } from "pinia";

export interface SearchBook {
	title: string;
	author: string;
	year?: number;
	coverUrl?: string;
	ol_key?: string;
	coverId?: string;
}

interface SearchApiResponse {
	total: number;
	items: SearchBook[];
}

interface CachedImageEntry {
	data: string;
	timestamp: number;
}

interface BookSearchState {
	searchQuery: string;
	searchResults: SearchBook[];
	isSearching: boolean;
	hasSearched: boolean;
	recentSearches: string[]; // <-- solo se alimenta desde el backend
	canGoBack: boolean;
	imageCache: Map<string, CachedImageEntry>;
	error: string | null;
}

const SEARCH_CONFIG = {
	MAX_RESULTS: 10,
	MAX_RECENT_SEARCHES: 5,
	CACHE_DURATION_MS: 60 * 1000, // 1 minuto
	IMAGE_TIMEOUT_MS: 2000, // 2 segundos
	IMAGE_QUALITY: 0.8,
	MAX_QUERY_LENGTH: 100,
	MIN_QUERY_LENGTH: 1,
} as const;

export const useBookSearchStore = defineStore("bookSearch", {
	state: (): BookSearchState => ({
		searchQuery: "",
		searchResults: [],
		isSearching: false,
		hasSearched: false,
		recentSearches: [], // backend is the source of truth
		canGoBack: false,
		imageCache: new Map<string, CachedImageEntry>(),
		error: null,
	}),

	getters: {
		hasResults: (state): boolean => state.searchResults.length > 0,
		resultsCount: (state): number => state.searchResults.length,
		hasRecentSearches: (state): boolean => state.recentSearches.length > 0,
		isValidQuery: (state): boolean => {
			const query = state.searchQuery.trim();
			return query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH && query.length <= SEARCH_CONFIG.MAX_QUERY_LENGTH;
		},
		booksWithCovers: (state): SearchBook[] => state.searchResults.filter((book) => book.coverUrl),
		cacheInfo: (state): { size: number; entries: number } => ({
			size: state.imageCache.size,
			entries: Array.from(state.imageCache.keys()).length,
		}),
	},

	actions: {
		validateSearchQuery(query: string): { isValid: boolean; error?: string } {
			if (!query || typeof query !== "string") {
				return { isValid: false, error: "La búsqueda debe ser un texto válido" };
			}
			const trimmedQuery = query.trim();
			if (trimmedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
				return { isValid: false, error: "La búsqueda debe tener al menos 1 carácter" };
			}
			if (trimmedQuery.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
				return { isValid: false, error: "La búsqueda es demasiado larga" };
			}
			return { isValid: true };
		},

		handleError(error: unknown, context: string): void {
			const errorMessage = error instanceof Error ? error.message : `Error desconocido en ${context}`;
			this.error = errorMessage;
			console.error(`[BookSearchStore] ${context}:`, error);
		},

		clearError(): void {
			this.error = null;
		},

		async performSearch(query: string): Promise<void> {
			const validation = this.validateSearchQuery(query);
			if (!validation.isValid) {
				this.handleError(new Error(validation.error), "validación de query");
				return;
			}

			const trimmedQuery = query.trim();
			if (this.isSearching && this.searchQuery === trimmedQuery) return;

			this.isSearching = true;
			this.hasSearched = true;
			this.searchQuery = trimmedQuery;
			this.clearError();

			try {
				const { get } = useApi();
				const response = await get<SearchApiResponse>(`/books/search?q=${encodeURIComponent(trimmedQuery)}`);

				if (!response || typeof response !== "object" || !Array.isArray(response.items)) {
					throw new Error("Respuesta inválida de la API");
				}

				let results = response.items.slice(0, SEARCH_CONFIG.MAX_RESULTS);
				results = await this.processImagesWithCache(results);
				this.searchResults = results;

				// NO cacheamos localmente; refrescamos desde el backend
				this.loadRecentSearches().catch(() => {});
				this.canGoBack = false;

				this.cleanExpiredCache();
			} catch (error) {
				this.handleError(error, "búsqueda de libros");
				this.searchResults = [];
			} finally {
				this.isSearching = false;
			}
		},

		async loadRecentSearches(): Promise<void> {
			try {
				const { get } = useApi();
				const response = await get<{ searches: string[] }>("/books/last-search");
				if (response && Array.isArray(response.searches)) {
					this.recentSearches = response.searches
						.filter((s) => typeof s === "string" && s.trim())
						.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES);
				}
			} catch (error) {
				this.handleError(error, "carga de búsquedas recientes");
			}
		},

		async processImagesWithCache(items: SearchBook[]): Promise<SearchBook[]> {
			try {
				const processedItems = await Promise.allSettled(items.map((item) => this.processImageWithCache(item)));
				return processedItems.map((result, index) => (result.status === "fulfilled" ? result.value : items[index]));
			} catch (error) {
				this.handleError(error, "procesamiento de imágenes");
				return items;
			}
		},

		async processImageWithCache(item: SearchBook): Promise<SearchBook> {
			if (!item.coverUrl) return item;

			const cachedImage = this.getCachedImage(item.coverUrl);
			if (cachedImage) {
				return { ...item, coverUrl: cachedImage };
			}

			try {
				const imageResult = await this.loadImageWithTimeout(item.coverUrl);
				if (imageResult !== item.coverUrl) {
					this.setCachedImage(item.coverUrl, imageResult);
				}
				return { ...item, coverUrl: imageResult };
			} catch (error) {
				console.warn(`Error procesando imagen para "${item.title}":`, error);
				return item;
			}
		},

		async loadImageWithTimeout(url: string): Promise<string> {
			const imagePromise = new Promise<string>((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";

				img.onload = () => {
					try {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");
						if (!ctx) throw new Error("No se pudo obtener contexto del canvas");

						canvas.width = img.width;
						canvas.height = img.height;
						ctx.drawImage(img, 0, 0);

						const dataUrl = canvas.toDataURL("image/jpeg", SEARCH_CONFIG.IMAGE_QUALITY);
						resolve(dataUrl);
					} catch (error) {
						reject(new Error(`Error procesando imagen: ${error}`));
					}
				};

				img.onerror = () => reject(new Error(`Error cargando imagen: ${url}`));
				img.src = url;
			});

			const timeoutPromise = new Promise<string>((resolve) => {
				setTimeout(() => resolve(url), SEARCH_CONFIG.IMAGE_TIMEOUT_MS);
			});

			return Promise.race([imagePromise, timeoutPromise]);
		},

		getCachedImage(url: string): string | null {
			if (!url || typeof url !== "string") return null;
			try {
				const cached = this.imageCache.get(url);
				if (cached && Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_DURATION_MS) {
					return cached.data;
				}
				if (cached) this.imageCache.delete(url);
			} catch (error) {
				console.warn("Error accediendo al cache de imágenes:", error);
			}
			return null;
		},

		setCachedImage(url: string, data: string): void {
			if (!url || !data || typeof url !== "string" || typeof data !== "string") return;
			if (!data.startsWith("data:image/")) return;

			try {
				this.imageCache.set(url, { data, timestamp: Date.now() });
			} catch (error) {
				console.warn("Error guardando en cache de imágenes:", error);
			}
		},

		cleanExpiredCache(): void {
			try {
				const now = Date.now();
				const expiredKeys: string[] = [];
				for (const [url, cached] of this.imageCache.entries()) {
					if (now - cached.timestamp >= SEARCH_CONFIG.CACHE_DURATION_MS) {
						expiredKeys.push(url);
					}
				}
				expiredKeys.forEach((key) => this.imageCache.delete(key));
			} catch (error) {
				console.warn("Error limpiando cache de imágenes:", error);
			}
		},

		setCanGoBack(value: boolean): void {
			this.canGoBack = Boolean(value);
		},

		clearSearch(): void {
			this.searchQuery = "";
			this.searchResults = [];
			this.hasSearched = false;
			this.canGoBack = false;
			this.clearError();
		},

		resetStore(): void {
			this.searchQuery = "";
			this.searchResults = [];
			this.isSearching = false;
			this.hasSearched = false;
			this.recentSearches = [];
			this.canGoBack = false;
			this.imageCache.clear();
			this.clearError();
		},
	},
});
