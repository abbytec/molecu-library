import { useNotificationStore } from "./useNotificationStore";
import type { BookWithId as LibraryBook, LibraryFilters, LibraryApiResponse } from "shared";
import { DEFAULT_LIBRARY_FILTERS } from "shared";
import { useAuthStore } from "./useAuthStore";

interface LibraryState {
	books: LibraryBook[];
	isLoading: boolean;
	total: number;
	filters: LibraryFilters;
	error: string | null;
}

// Exportamos los tipos para compatibilidad hacia atrás
export type { LibraryBook, LibraryFilters, LibraryApiResponse };

export const useLibraryStore = defineStore("library", {
	state: (): LibraryState => ({
		books: [],
		isLoading: false,
		total: 0,
		filters: { ...DEFAULT_LIBRARY_FILTERS },
		error: null,
	}),

	getters: {
		filteredBooks: (state): LibraryBook[] => {
			return state.books;
		},

		hasBooks: (state): boolean => {
			return state.books.length > 0;
		},

		hasActiveFilters: (state): boolean => {
			return state.filters.q.trim() !== "" || state.filters.sort !== "" || state.filters.withReview;
		},

		booksWithRating: (state): LibraryBook[] => {
			return state.books.filter((book) => book.rating && book.rating > 0);
		},

		booksWithReviews: (state): LibraryBook[] => {
			return state.books.filter((book) => book.review && book.review.trim() !== "");
		},
	},

	actions: {
		buildLibraryUrl(apiBase: string, filters?: LibraryFilters): string {
			const params = new URLSearchParams();
			const currentFilters = filters || this.filters;

			if (currentFilters.q.trim()) {
				params.append("q", currentFilters.q.trim());
			}

			if (currentFilters.sort) {
				params.append("sort", currentFilters.sort);
			}

			if (currentFilters.withReview) {
				params.append("withReview", "true");
			}

			const queryString = params.toString();
			const finalQueryString = queryString ? `?${queryString}` : "";
			return `/books/my-library${finalQueryString}`;
		},

		// Mejora 8: Manejo de errores más robusto
		handleError(error: unknown, defaultMessage: string): void {
			const errorMessage = error instanceof Error ? error.message : defaultMessage;
			this.error = errorMessage;

			console.error(defaultMessage, error);

			const notificationStore = useNotificationStore();
			notificationStore.error(errorMessage);
		},

		// Mejora 9: Función de carga con mejor tipado y manejo de errores
		async loadBooks(apiBase: string): Promise<void> {
			// Evitar múltiples cargas simultáneas
			if (this.isLoading) return;

			this.isLoading = true;
			this.error = null;

			try {
				const url = this.buildLibraryUrl(apiBase);
				const authStore = useAuthStore();

				const response = await $fetch<LibraryApiResponse>(`${apiBase}${url}`, {
					headers: authStore.authHeaders,
					timeout: 10000,
				});

				if (!response || typeof response !== "object") {
					throw new Error("Respuesta inválida del servidor");
				}

				this.$patch({
					books: response.items || [],
					total: response.total || 0,
					error: null,
				});
			} catch (error) {
				if (error instanceof TypeError && error.message.includes("fetch")) {
					this.handleError(error, "Error de conexión. Verifica tu conexión a internet.");
				} else if (error instanceof Error && error.message.includes("timeout")) {
					this.handleError(error, "La solicitud tardó demasiado. Inténtalo de nuevo.");
				} else {
					this.handleError(error, "Error al cargar la biblioteca");
				}

				this.$patch({
					books: [],
					total: 0,
				});
			} finally {
				this.isLoading = false;
			}
		},

		async updateBook(
			apiBase: string,
			bookId: string,
			data: { review?: string; rating?: number }
		): Promise<{ ok: boolean; book: LibraryBook } | null> {
			if (!bookId || !apiBase) {
				throw new Error("Parámetros requeridos faltantes");
			}

			const bookIndex = this.books.findIndex((book) => book._id === bookId);
			const originalBook = bookIndex !== -1 ? { ...this.books[bookIndex] } : null;

			if (bookIndex !== -1) {
				this.books[bookIndex] = { ...this.books[bookIndex], ...data };
			}

			try {
				const authStore = useAuthStore();
				const response = await $fetch<{ ok: boolean; book: LibraryBook }>(`${apiBase}/books/my-library/${bookId}`, {
					method: "PUT",
					body: data,
					headers: authStore.authHeaders,
					timeout: 10000,
				});

				if (!response?.ok) {
					throw new Error("Error en la respuesta del servidor");
				}

				const notificationStore = useNotificationStore();
				notificationStore.success("¡Libro actualizado exitosamente!");

				return response;
			} catch (error) {
				if (originalBook && bookIndex !== -1) {
					this.books[bookIndex] = originalBook;
				}

				this.handleError(error, "Error al actualizar el libro");
				throw error;
			}
		},

		async deleteBook(apiBase: string, bookId: string): Promise<void> {
			if (!bookId || !apiBase) {
				throw new Error("Parámetros requeridos faltantes");
			}

			const bookIndex = this.books.findIndex((book) => book._id === bookId);
			const originalBook = bookIndex !== -1 ? this.books[bookIndex] : null;
			const originalTotal = this.total;

			if (bookIndex !== -1) {
				this.books.splice(bookIndex, 1);
				this.total = Math.max(0, this.total - 1);
			}

			try {
				const authStore = useAuthStore();
				await $fetch(`${apiBase}/books/my-library/${bookId}`, {
					method: "DELETE",
					headers: authStore.authHeaders,
					timeout: 10000,
				});

				const notificationStore = useNotificationStore();
				notificationStore.success("¡Libro eliminado exitosamente!");
			} catch (error) {
				// Rollback en caso de error
				if (originalBook && bookIndex !== -1) {
					this.books.splice(bookIndex, 0, originalBook);
					this.total = originalTotal;
				}

				this.handleError(error, "Error al eliminar el libro");
				throw error;
			}
		},

		setFilters(newFilters: Partial<LibraryFilters>): void {
			const cleanFilters = {
				...this.filters,
				...newFilters,
				q: newFilters.q?.trim() || this.filters.q,
			};

			this.filters = cleanFilters;
		},

		clearFilters(): void {
			this.filters = { ...DEFAULT_LIBRARY_FILTERS };
		},

		clearError(): void {
			this.error = null;
		},

		$reset(): void {
			this.$patch({
				books: [],
				isLoading: false,
				total: 0,
				filters: { ...DEFAULT_LIBRARY_FILTERS },
				error: null,
			});
		},
	},
});
