<template>
	<div class="book-search-page">
		<!-- Sección del buscador -->
		<div class="book-search-page__search-section">
			<MBookSearch ref="searchComponent" :is-loading="isSearching" @search="handleSearch" />

			<MRecentSearches :searches="recentSearches" @search-click="handleRecentSearchClick" />
		</div>

		<!-- Resultados de búsqueda -->
		<div v-if="hasSearched" class="book-search-page__results">
			<div v-if="isSearching" class="book-search-page__loading">
				<div class="book-search-page__spinner"></div>
				<p>Buscando libros...</p>
			</div>

			<div v-else-if="searchResults.length === 0" class="book-search-page__no-results">
				<h3>No encontramos libros con el título ingresado</h3>
				<p>Intenta con otro término de búsqueda</p>
			</div>

			<div v-else class="book-search-page__results-grid">
				<h3 class="book-search-page__results-title">Resultados de búsqueda para: "{{ lastSearchQuery }}"</h3>
				<div class="book-search-page__grid">
					<ABookCard v-for="book in searchResults" :key="book.ol_key || book.title" :book="book" @click="handleBookClick" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import MBookSearch from "~/components/molecules/MBookSearch.vue";
import MRecentSearches from "~/components/molecules/MRecentSearches.vue";
import ABookCard from "~/components/atoms/ABookCard.vue";
import { useBookSearchStore } from "~/stores/useBookSearchStore";
import { useBookStore } from "~/stores/useBookStore";
import { ref, onMounted, computed, nextTick } from "vue";

interface Book {
	title: string;
	author: string;
	year?: number;
	coverUrl?: string;
	ol_key?: string;
	coverId?: string;
}

const searchComponent = ref();
const bookSearchStore = useBookSearchStore();
const bookStore = useBookStore();

// Computed properties para usar el estado del store
const isSearching = computed(() => bookSearchStore.isSearching);
const hasSearched = computed(() => bookSearchStore.hasSearched);
const searchResults = computed(() => bookSearchStore.searchResults);
const recentSearches = computed(() => bookSearchStore.recentSearches);
const lastSearchQuery = computed(() => bookSearchStore.searchQuery);

// Cargar búsquedas recientes al montar el componente
onMounted(async () => {
	await bookSearchStore.loadRecentSearches();
	
	// Si hay una búsqueda previa y resultados, actualizar el campo de búsqueda
	if (bookSearchStore.searchQuery && searchComponent.value) {
		nextTick(() => {
			searchComponent.value.setSearch(bookSearchStore.searchQuery);
		});
	}
});

const handleSearch = async (query: string) => {
	await bookSearchStore.performSearch(query);
};

const handleRecentSearchClick = (query: string) => {
	if (searchComponent.value) {
		searchComponent.value.setSearch(query);
		handleSearch(query);
	}
};

const handleBookClick = (book: Book) => {
	// Guardar el libro seleccionado en el store
	bookStore.setSelectedBook(book);
	
	// Marcar que se puede volver a los resultados
	bookSearchStore.setCanGoBack(true);
	
	// Encodear la key para manejar caracteres especiales como slashes
	const encodedKey = encodeURIComponent(book.ol_key || 'unknown');
	
	// Navegar a la página de detalles
	navigateTo(`/book/${encodedKey}`);
};
</script>

<style scoped lang="scss">
.book-search-page {
	min-height: 100vh;
	padding: 2rem 0;

	&__search-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	&__results {
		margin-top: 3rem;
	}

	&__loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: $text-muted;

		p {
			margin: 1rem 0 0 0;
			font-size: 1.125rem;
		}
	}

	&__spinner {
		width: 40px;
		height: 40px;
		border: 3px solid $border;
		border-top: 3px solid $primary;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	&__no-results {
		text-align: center;
		padding: 3rem;
		background: $surface;
		border: 1px solid $border;
		border-radius: 12px;
		margin: 0 auto;
		max-width: 500px;

		h3 {
			color: $text;
			margin: 0 0 1rem 0;
			font-size: 1.25rem;
		}

		p {
			color: $text-muted;
			margin: 0;
		}
	}

	&__results-grid {
		max-width: 1200px;
		margin: 0 auto;
	}

	&__results-title {
		text-align: center;
		color: $text;
		margin: 0 0 2rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
		margin: 0 auto;

		@media (max-width: 768px) {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 1rem;
		}

		@media (max-width: 480px) {
			grid-template-columns: 1fr 1fr;
			gap: 0.75rem;
		}
	}
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
