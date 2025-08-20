import { useNotificationStore } from "./useNotificationStore";

interface LibraryBook {
	_id: string;
	ol_key: string;
	title: string;
	author: string;
	year?: number;
	review?: string;
	rating?: number;
	coverUrl?: string;
}

interface LibraryFilters {
	q: string;
	sort: "rating_asc" | "rating_desc" | "";
	withReview: boolean;
}

export const useLibraryStore = defineStore("library", {
	state: () => ({
		books: [] as LibraryBook[],
		isLoading: false,
		total: 0,
		filters: {
			q: "",
			sort: "",
			withReview: false,
		} as LibraryFilters,
	}),

	getters: {
		filteredBooks: (state) => {
			return state.books;
		},
	},

	actions: {
		async loadBooks(apiBase: string) {
			this.isLoading = true;
			try {
				const params = new URLSearchParams();

				if (this.filters.q.trim()) {
					params.append("q", this.filters.q.trim());
				}

				if (this.filters.sort) {
					params.append("sort", this.filters.sort);
				}

				if (this.filters.withReview) {
					params.append("withReview", "true");
				}

				const queryString = params.toString();
				const url = `/books/my-library${queryString ? `?${queryString}` : ""}`;

				const response = (await $fetch(`${apiBase}${url}`, {
					credentials: "include",
				})) as { items: LibraryBook[]; total: number };

				this.books = response.items || [];
				this.total = response.total || 0;
			} catch (error) {
				console.error("Error cargando biblioteca:", error);
				const notificationStore = useNotificationStore();
				notificationStore.error("Error al cargar la biblioteca");
				this.books = [];
				this.total = 0;
			} finally {
				this.isLoading = false;
			}
		},

		async updateBook(apiBase: string, bookId: string, data: { review?: string; rating?: number }) {
			try {
				const response = (await $fetch(`${apiBase}/books/my-library/${bookId}`, {
					method: "PUT",
					body: data,
					credentials: "include",
				})) as { ok: boolean; book: LibraryBook };

				// Actualizar el libro en el estado local
				const bookIndex = this.books.findIndex((book) => book._id === bookId);
				if (bookIndex !== -1) {
					this.books[bookIndex] = { ...this.books[bookIndex], ...data };
				}

				const notificationStore = useNotificationStore();
				notificationStore.success("¡Libro actualizado exitosamente!");

				return response;
			} catch (error) {
				console.error("Error actualizando libro:", error);
				const notificationStore = useNotificationStore();
				notificationStore.error("Error al actualizar el libro");
				throw error;
			}
		},

		async deleteBook(apiBase: string, bookId: string) {
			try {
				await $fetch(`${apiBase}/books/my-library/${bookId}`, {
					method: "DELETE",
					credentials: "include",
				});

				// Remover el libro del estado local
				this.books = this.books.filter((book) => book._id !== bookId);
				this.total = Math.max(0, this.total - 1);

				const notificationStore = useNotificationStore();
				notificationStore.success("¡Libro eliminado exitosamente!");
			} catch (error) {
				console.error("Error eliminando libro:", error);
				const notificationStore = useNotificationStore();
				notificationStore.error("Error al eliminar el libro");
				throw error;
			}
		},

		setFilters(newFilters: Partial<LibraryFilters>) {
			this.filters = { ...this.filters, ...newFilters };
		},

		clearFilters() {
			this.filters = {
				q: "",
				sort: "",
				withReview: false,
			};
		},
	},
});
