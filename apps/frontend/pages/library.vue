<template>
	<AContainer>
		<div class="library-page">
			<header class="library-header">
				<h1 class="library-title">Mi biblioteca</h1>
				<p class="library-subtitle" aria-live="polite">{{ libraryStore.total }} {{ libraryStore.total === 1 ? "libro" : "libros" }}</p>
			</header>
			<section class="library-filters" aria-label="Filtros de búsqueda">
				<div class="search-section">
					<label for="search-input" class="sr-only">Buscar libros</label>
					<AInput
						id="search-input"
						v-model="searchQuery"
						placeholder="Buscar por título o autor..."
						type="search"
						class="search-input"
						aria-describedby="search-help"
						@input="handleSearch" />
					<div id="search-help" class="sr-only">Busca libros por título o autor. Los resultados se actualizan automáticamente.</div>
				</div>

				<div class="filter-section">
					<div class="filter-group">
						<label for="sort-select" class="filter-label">Ordenar por:</label>
						<select
							id="sort-select"
							v-model="sortOption"
							class="filter-select"
							aria-describedby="sort-help"
							@change="handleFilterChange">
							<option value="">Sin ordenar</option>
							<option value="rating_desc">Calificación (mayor a menor)</option>
							<option value="rating_asc">Calificación (menor a mayor)</option>
						</select>
						<div id="sort-help" class="sr-only">Cambia el orden de los libros en la lista.</div>
					</div>

					<div class="filter-group">
						<label class="filter-checkbox">
							<input v-model="onlyWithReview" type="checkbox" aria-describedby="review-filter-help" @change="handleFilterChange" />
							<span class="checkmark"></span>
							Solo libros con reseña
						</label>
						<div id="review-filter-help" class="sr-only">Muestra únicamente los libros que tienen una reseña escrita.</div>
					</div>

					<AButton
						variant="ghost"
						@click="clearFilters"
						class="clear-filters-btn"
						:aria-label="`Limpiar filtros${hasActiveFilters ? ' activos' : ''}`">
						Limpiar filtros
					</AButton>
				</div>
			</section>

			<!-- Mejora 3: Mejor manejo de estados de carga -->
			<main class="library-content" aria-live="polite">
				<!-- Loading state -->
				<div v-if="libraryStore.isLoading" class="loading-state" role="status" aria-label="Cargando">
					<div class="loading-spinner" aria-hidden="true"></div>
					<p>Cargando biblioteca...</p>
				</div>

				<!-- Empty state -->
				<div v-else-if="libraryStore.books.length === 0" class="empty-state">
					<div class="empty-state__content">
						<h2>{{ hasActiveFilters ? "No se encontraron libros" : "Tu biblioteca está vacía" }}</h2>
						<p v-if="hasActiveFilters">Intenta cambiar los filtros de búsqueda</p>
						<p v-else>Comienza agregando libros desde la búsqueda</p>
						<AButton @click="navigateToSearch" class="empty-state__button" aria-label="Ir a buscar libros"> Buscar libros </AButton>
					</div>
				</div>

				<!-- Books grid -->
				<section v-else class="books-grid" aria-label="Lista de libros">
					<MLibraryBookCard
						v-for="book in libraryStore.books"
						:key="book._id"
						:book="book"
						@edit="handleEditBook"
						@delete="handleDeleteBook" />
				</section>
			</main>
		</div>
		<OConfirmDialog
			:is-open="isDeleteDialogOpen"
			:title="`¿Eliminar '${selectedBook?.title}'?`"
			message="Esta acción eliminará permanentemente el libro de tu biblioteca. Esta acción no se puede deshacer."
			confirm-text="Eliminar libro"
			cancel-text="Cancelar"
			:is-loading="isDeleting"
			@confirm="handleConfirmDelete"
			@cancel="closeDeleteDialog" />
	</AContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useLibraryStore } from "../stores/useLibraryStore";
import { navigateTo, useRuntimeConfig } from "#app";
import AContainer from "~/components/atoms/AContainer.vue";
import AButton from "~/components/atoms/AButton.vue";
import AInput from "~/components/atoms/AInput.vue";
import MLibraryBookCard from "~/components/molecules/MLibraryBookCard.vue";
import OConfirmDialog from "~/components/organisms/OConfirmDialog.vue";
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
// Stores y composables
const libraryStore = useLibraryStore();
const {
	public: { apiBase },
} = useRuntimeConfig();

const searchQuery = ref<string>("");
const sortOption = ref<string>("");
const onlyWithReview = ref<boolean>(false);

const isDeleteDialogOpen = ref<boolean>(false);
const selectedBook = ref<LibraryBook | null>(null);
const isDeleting = ref<boolean>(false);

const SEARCH_DEBOUNCE_MS = 300;
let searchTimeout: NodeJS.Timeout | null = null;

const hasActiveFilters = computed(() => {
	return searchQuery.value.trim() || sortOption.value || onlyWithReview.value;
});

const handleSearch = (): void => {
	if (searchTimeout) {
		clearTimeout(searchTimeout);
	}
	searchTimeout = setTimeout(() => {
		libraryStore.setFilters({ q: searchQuery.value });
		loadBooks();
	}, SEARCH_DEBOUNCE_MS);
};

const handleFilterChange = (): void => {
	libraryStore.setFilters({
		sort: sortOption.value as any,
		withReview: onlyWithReview.value,
	});
	loadBooks();
};

const clearFilters = (): void => {
	searchQuery.value = "";
	sortOption.value = "";
	onlyWithReview.value = false;
	libraryStore.clearFilters();
	loadBooks();
};

const loadBooks = async (): Promise<void> => {
	try {
		await libraryStore.loadBooks(apiBase);
	} catch (error) {
		console.error("Error cargando biblioteca:", error);
	}
};

const navigateToSearch = (): void => {
	navigateTo("/home");
};

// Funciones de edición
const handleEditBook = (book: LibraryBook): void => {
	if (book.ol_key) {
		const encodedKey = encodeURIComponent(book.ol_key);
		// En un proyecto real usarías navigateTo(`/book/${encodedKey}`) de Nuxt
		window.location.href = `/book/${encodedKey}`;
	}
};

// Funciones de eliminación
const handleDeleteBook = (book: LibraryBook): void => {
	selectedBook.value = book;
	isDeleteDialogOpen.value = true;
};

const closeDeleteDialog = (): void => {
	isDeleteDialogOpen.value = false;
	selectedBook.value = null;
};

const handleConfirmDelete = async (): Promise<void> => {
	if (!selectedBook.value) return;

	isDeleting.value = true;
	try {
		await libraryStore.deleteBook(apiBase, selectedBook.value._id);
		closeDeleteDialog();
	} catch (error) {
		console.error("Error eliminando libro:", error);
	} finally {
		isDeleting.value = false;
	}
};

// Lifecycle
onMounted(() => {
	loadBooks();
});

// Limpiar timeouts al desmontar
onUnmounted(() => {
	if (searchTimeout) {
		clearTimeout(searchTimeout);
		searchTimeout = null;
	}
});
</script>

<style scoped lang="scss">
$card-min-width: 280px;
$grid-gap-mobile: 1.5rem;
$grid-gap-desktop: 2rem;
$content-padding-mobile: 1rem;
$content-padding-desktop: 2rem;

.library-page {
	padding: $content-padding-desktop 0;
}

.library-header {
	margin-bottom: 2rem;
	text-align: center;

	.library-title {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: $text;
	}

	.library-subtitle {
		margin: 0;
		font-size: 1rem;
		color: $text-muted;
	}
}

.library-filters {
	background: $surface;
	border: 1px solid $border;
	border-radius: 12px;
	padding: 1.5rem;
	margin-bottom: 2rem;

	.search-section {
		margin-bottom: 1.5rem;

		.search-input {
			width: 100%;
			max-width: 400px;
		}
	}

	.filter-section {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		@media (min-width: 768px) {
			flex-direction: row;
			align-items: center;
		}
	}

	.filter-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: $text;
		white-space: nowrap;
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid $border;
		border-radius: 8px;
		background: $surface;
		color: $text;
		font-size: 0.875rem;
		min-width: 200px;

		&:focus {
			outline: none;
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.2);
		}
	}

	.filter-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: $text;
		cursor: pointer;
		user-select: none;

		input[type="checkbox"] {
			appearance: none;
			width: 18px;
			height: 18px;
			border: 2px solid $border;
			border-radius: 4px;
			background: $surface;
			position: relative;
			cursor: pointer;
			transition: all 0.2s ease;

			&:checked {
				background: $primary;
				border-color: $primary;

				&::after {
					content: "✓";
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					color: white;
					font-size: 12px;
					font-weight: bold;
				}
			}

			&:focus {
				outline: 2px solid $primary;
				outline-offset: 2px;
			}

			&:hover:not(:disabled) {
				border-color: $primary;
			}
		}
	}

	.clear-filters-btn {
		margin-left: auto;
	}
}

.loading-state {
	text-align: center;
	padding: 3rem 0;
	color: $text-muted;

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid $border;
		border-top: 3px solid $primary;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
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

.empty-state {
	text-align: center;
	padding: 3rem 0;

	&__content {
		max-width: 400px;
		margin: 0 auto;

		h2 {
			margin: 0 0 1rem 0;
			font-size: 1.25rem;
			color: $text;
		}

		p {
			margin: 0 0 1.5rem 0;
			color: $text-muted;
			line-height: 1.5;
		}
	}

	&__button {
		margin-top: 1rem;
	}
}

.books-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax($card-min-width, 1fr));
	gap: $grid-gap-mobile;

	@media (min-width: 768px) {
		gap: $grid-gap-desktop;
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
	.library-page {
		padding: $content-padding-mobile 0;
	}

	.library-filters {
		padding: 1rem;

		.filter-section {
			flex-direction: column;
			align-items: stretch;
		}

		.clear-filters-btn {
			margin-left: 0;
			align-self: flex-start;
		}
		*:focus {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}
	}

	.books-grid {
		grid-template-columns: 1fr;
	}
}
</style>
