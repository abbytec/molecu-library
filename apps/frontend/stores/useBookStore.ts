import { useNotificationStore } from "./useNotificationStore";
import { useAuthStore } from "./useAuthStore";
import type { BookInput } from "shared";

export const useBookStore = defineStore("book", {
	state: () => ({
		selectedBook: null as any,
		isLoading: false,
	}),

	actions: {
		setSelectedBook(book: any) {
			this.selectedBook = book;
		},

		clearSelectedBook() {
			this.selectedBook = null;
		},

		async saveBookToLibrary(apiBase: string, bookData: BookInput) {
			this.isLoading = true;
			try {
				const authStore = useAuthStore();
				const response = await $fetch(`${apiBase}/books/my-library`, {
					method: "POST",
					body: bookData,
					headers: authStore.authHeaders,
				});

				const notificationStore = useNotificationStore();
				notificationStore.success("¡Libro guardado exitosamente en tu biblioteca!");

				return response;
			} catch (error) {
				console.error("Error guardando libro:", error);

				const notificationStore = useNotificationStore();
				notificationStore.error("Error al guardar el libro. Inténtalo de nuevo.");

				throw error;
			} finally {
				this.isLoading = false;
			}
		},
	},
});
