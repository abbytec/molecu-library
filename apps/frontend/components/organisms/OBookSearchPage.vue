<template>
	<div class="book-search-page">
		<!-- Sección del buscador -->
		<section class="book-search-page__search-section" aria-label="Búsqueda y filtros">
			<MBookSearch ref="searchComponent" :is-loading="isSearching" @search="handleSearch" aria-describedby="search-help" />

			<div id="search-help" class="sr-only">
				Ingresa el título de un libro para buscar en nuestro catálogo. Los resultados aparecerán automáticamente.
			</div>

			<MRecentSearches :searches="recentSearches" @search-click="handleRecentSearchClick" aria-label="Búsquedas recientes" />
		</section>

		<!-- Resultados de búsqueda -->
		<main class="book-search-page__content" aria-live="polite">
			<section v-if="hasSearched" class="book-search-page__results" aria-label="Resultados de búsqueda">
				<!-- Loading state -->
				<output v-if="isSearching" class="book-search-page__loading" aria-label="Buscando">
					<div class="book-search-page__spinner" aria-hidden="true"></div>
					<p>Buscando libros<span class="loading-dots">...</span></p>
				</output>

				<!-- Error state -->
				<output v-else-if="searchError" class="book-search-page__error" role="alert">
					<div class="error-icon" aria-hidden="true">⚠️</div>
					<h3>Error en la búsqueda</h3>
					<p>{{ searchError }}</p>
					<AButton @click="retryLastSearch" variant="ghost" class="retry-button"> Intentar de nuevo </AButton>
				</output>

				<!-- No results state -->
				<output v-else-if="searchResults.length === 0" class="book-search-page__no-results">
					<div class="no-results-icon" aria-hidden="true">📚</div>
					<h3>No encontramos libros con el término "{{ lastSearchQuery }}"</h3>
					<div class="suggestions">
						<p>Sugerencias para mejorar la búsqueda:</p>
						<ul>
							<li>Verifica la ortografía del título o autor</li>
							<li>Intenta con términos más generales</li>
							<li>Prueba buscando solo el apellido del autor</li>
						</ul>
					</div>
				</output>

				<!-- Results grid -->
				<output v-else class="book-search-page__results-grid">
					<header class="results-header">
						<h2 class="book-search-page__results-title">
							{{ resultsCount }} resultado{{ resultsCount !== 1 ? "s" : "" }} para:
							<span class="search-term">"{{ lastSearchQuery }}"</span>
						</h2>
						<div class="results-meta" aria-live="polite">
							<span class="results-count"> Mostrando {{ resultsCount }} libros encontrados </span>
						</div>
					</header>

					<div class="book-search-page__grid" role="grid" :aria-label="`${resultsCount} libros encontrados`">
						<ABookCard
							v-for="(book, index) in searchResults"
							:key="generateBookKey(book, index)"
							:book="book"
							@click="handleBookClick"
							:tabindex="0"
							:aria-label="generateBookAriaLabel(book)"
							@keydown="handleCardKeydown($event, book)" />
					</div>
				</output>
			</section>

			<!-- Welcome screen -->
			<section v-else class="book-search-page__welcome" aria-label="Pantalla de bienvenida">
				<div class="welcome-content">
					<div class="welcome-icon" aria-hidden="true">🔍</div>
					<h2>Explora nuestra biblioteca</h2>
					<p>Busca entre miles de libros y construye tu biblioteca personal</p>
				</div>
			</section>
		</main>
	</div>
</template>

<script setup lang="ts">
import MBookSearch from "~/components/molecules/MBookSearch.vue";
import MRecentSearches from "~/components/molecules/MRecentSearches.vue";
import ABookCard from "~/components/atoms/ABookCard.vue";
import { useBookSearchStore, type SearchBook } from "~/stores/useBookSearchStore";
import { useBookStore } from "~/stores/useBookStore";
import { ref, onMounted, computed, nextTick } from "vue";

interface SearchComponentRef {
	setSearch: (query: string) => void;
}

const PAGE_CONFIG = {
	MAX_RECENT_SEARCHES_DISPLAY: 3,
	MIN_QUERY_LENGTH: 1,
	KEY_CODES: {
		ENTER: "Enter",
		SPACE: " ",
	},
} as const;

const searchComponent = ref<SearchComponentRef | null>(null);
const bookSearchStore = useBookSearchStore();
const bookStore = useBookStore();

const isSearching = computed((): boolean => bookSearchStore.isSearching);
const hasSearched = computed((): boolean => bookSearchStore.hasSearched);
const searchResults = computed((): SearchBook[] => bookSearchStore.searchResults);
const recentSearches = computed((): string[] => bookSearchStore.recentSearches);
const lastSearchQuery = computed((): string => bookSearchStore.searchQuery);
const searchError = computed((): string | null => bookSearchStore.error);
const resultsCount = computed((): number => bookSearchStore.resultsCount);
const hasRecentSearches = computed((): boolean => bookSearchStore.hasRecentSearches);
const displayedRecentSearches = computed((): string[] => recentSearches.value.slice(0, PAGE_CONFIG.MAX_RECENT_SEARCHES_DISPLAY));

const isValidSearchQuery = (query: string): boolean => {
	return typeof query === "string" && query.trim().length >= PAGE_CONFIG.MIN_QUERY_LENGTH;
};

const generateBookKey = (book: SearchBook, index: number): string => {
	return book.ol_key || `${book.title}-${book.author}-${index}`;
};

const generateBookAriaLabel = (book: SearchBook): string => {
	const parts = [book.title, "por", book.author];
	if (book.year) {
		parts.push(`publicado en ${book.year}`);
	}
	return parts.join(" ");
};

const handleComponentError = (error: unknown, context: string): void => {
	console.error(`[OBookSearchPage] Error en ${context}:`, error);

	// Limpiar error del store si existe
	if (bookSearchStore.error) {
		bookSearchStore.clearError();
	}
};

onMounted(async (): Promise<void> => {
	try {
		// Cargar búsquedas recientes
		await bookSearchStore.loadRecentSearches();

		// Restaurar búsqueda previa si existe
		if (bookSearchStore.searchQuery && searchComponent.value) {
			await nextTick();
			searchComponent.value?.setSearch?.(bookSearchStore.searchQuery);
		}
	} catch (error) {
		handleComponentError(error, "inicialización del componente");
	}
});

const handleSearch = async (query: string): Promise<void> => {
	try {
		// Validación de entrada
		if (!isValidSearchQuery(query)) {
			console.warn("Query de búsqueda inválida:", query);
			return;
		}

		await bookSearchStore.performSearch(query);
	} catch (error) {
		handleComponentError(error, "búsqueda de libros");
	}
};

const retryLastSearch = async (): Promise<void> => {
	try {
		const lastQuery = lastSearchQuery.value;
		if (!lastQuery) {
			console.warn("No hay búsqueda anterior para reintentar");
			return;
		}

		bookSearchStore.clearError();

		await handleSearch(lastQuery);
	} catch (error) {
		handleComponentError(error, "reintento de búsqueda");
	}
};

const handleRecentSearchClick = async (query: string): Promise<void> => {
	try {
		if (!isValidSearchQuery(query)) {
			console.warn("Query de búsqueda reciente inválida:", query);
			return;
		}

		if (searchComponent.value?.setSearch) {
			searchComponent.value.setSearch(query);
		}

		await handleSearch(query);
	} catch (error) {
		handleComponentError(error, "búsqueda reciente");
	}
};

const handleBookClick = (book: SearchBook): void => {
	try {
		if (!book || typeof book !== "object") {
			console.warn("Libro inválido proporcionado:", book);
			return;
		}

		if (!book.ol_key) {
			console.warn("Libro sin ol_key:", book);
			return;
		}

		bookStore.setSelectedBook(book);
		bookSearchStore.setCanGoBack(true);
		const encodedKey = encodeURIComponent(book.ol_key);

		navigateTo(`/book/${encodedKey}`);
	} catch (error) {
		handleComponentError(error, "navegación a detalles del libro");
	}
};

const handleCardKeydown = (event: KeyboardEvent, book: SearchBook): void => {
	try {
		if (event.key === PAGE_CONFIG.KEY_CODES.ENTER || event.key === PAGE_CONFIG.KEY_CODES.SPACE) {
			event.preventDefault();
			handleBookClick(book);
		}
	} catch (error) {
		handleComponentError(error, "navegación por teclado");
	}
};
</script>

<style scoped lang="scss">
$search-spacing: 2rem;
$content-spacing: 3rem;
$card-min-width: 250px;
$animation-duration: 0.3s;
$border-radius: 12px;

.book-search-page {
	min-height: 100vh;
	padding: $search-spacing 0;

	&__search-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	&__content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	&__results {
		margin-top: $content-spacing;
		animation: fadeIn $animation-duration ease-in-out;
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

	&__error {
		text-align: center;
		padding: 3rem;
		background: $surface;
		border: 1px solid $danger;
		border-radius: $border-radius;
		margin: 0 auto;
		max-width: 500px;

		.error-icon {
			font-size: 3rem;
			margin-bottom: 1rem;
		}

		h3 {
			color: $danger;
			margin: 0 0 1rem 0;
			font-size: 1.25rem;
		}

		p {
			color: $text-muted;
			margin: 0 0 1.5rem 0;
		}

		.retry-button {
			--btn-bg: #{$danger};
			--btn-bg-hover: #{darken($danger, 10%)};
		}
	}

	&__no-results {
		text-align: center;
		padding: 3rem;
		background: $surface;
		border: 1px solid $border;
		border-radius: $border-radius;
		margin: 0 auto;
		max-width: 600px;

		.no-results-icon {
			font-size: 4rem;
			margin-bottom: 1rem;
			opacity: 0.7;
		}

		h3 {
			color: $text;
			margin: 0 0 1.5rem 0;
			font-size: 1.25rem;
		}

		.suggestions {
			text-align: left;
			max-width: 400px;
			margin: 0 auto;

			p {
				color: $text;
				font-weight: 600;
				margin: 0 0 0.5rem 0;
			}

			ul {
				color: $text-muted;
				padding-left: 1.5rem;
				margin: 0;

				li {
					margin-bottom: 0.5rem;
					line-height: 1.4;
				}
			}
		}
	}

	.results-header {
		margin-bottom: 2rem;
		text-align: center;

		.book-search-page__results-title {
			color: $text;
			margin: 0 0 0.5rem 0;
			font-size: 1.5rem;
			font-weight: 600;

			.search-term {
				color: $primary;
				font-weight: 700;
			}
		}

		.results-meta {
			display: flex;
			justify-content: center;
			gap: 1rem;
			font-size: 0.875rem;
			color: $text-muted;
		}
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax($card-min-width, 1fr));
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

	&__welcome {
		text-align: center;
		padding: 4rem 2rem;
		animation: fadeIn $animation-duration ease-in-out;

		.welcome-content {
			max-width: 600px;
			margin: 0 auto;

			.welcome-icon {
				font-size: 4rem;
				margin-bottom: 1.5rem;
				opacity: 0.8;
			}

			h2 {
				color: $text;
				margin: 0 0 1rem 0;
				font-size: 2rem;
				font-weight: 700;
			}

			> p {
				color: $text-muted;
				margin: 0 0 2rem 0;
				font-size: 1.125rem;
				line-height: 1.6;
			}
		}

		.welcome-stats {
			h3 {
				color: $text;
				margin: 0 0 1rem 0;
				font-size: 1.125rem;
			}

			.recent-searches-preview {
				display: flex;
				justify-content: center;
				gap: 0.5rem;
				flex-wrap: wrap;

				.recent-search-pill {
					background: $surface;
					border: 1px solid $border;
					border-radius: 20px;
					padding: 0.5rem 1rem;
					color: $text;
					font-size: 0.875rem;
					cursor: pointer;
					transition: all 0.2s ease;

					&:hover {
						background: $primary;
						color: $text-inverse;
						border-color: $primary;
					}

					&:focus {
						outline: 2px solid $primary;
						outline-offset: 2px;
					}
				}
			}
		}
	}
	*:focus {
		outline: 2px solid $primary;
		outline-offset: 2px;
	}

	// Focus específico para cards
	&__grid > * {
		&:focus {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba($primary, 0.3);
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

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// Loading dots animation
.loading-dots {
	animation: loadingDots 1.5s infinite;
}

@keyframes loadingDots {
	0%,
	20% {
		content: "";
	}
	40% {
		content: ".";
	}
	60% {
		content: "..";
	}
	80%,
	100% {
		content: "...";
	}
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

@media (max-width: 767px) {
	.book-search-page {
		padding: 1rem 0;

		&__search-section {
			gap: 1rem;
		}

		&__welcome {
			padding: 2rem 1rem;

			.welcome-content h2 {
				font-size: 1.5rem;
			}
		}
	}
}
</style>
