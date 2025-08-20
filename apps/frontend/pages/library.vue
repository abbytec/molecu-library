<template>
	<AContainer>
		<div class="library-page">
			<div class="library-header">
				<h1 class="library-title">Mi biblioteca</h1>
				<p class="library-subtitle">{{ libraryStore.total }} {{ libraryStore.total === 1 ? "libro" : "libros" }}</p>
			</div>

			<!-- Filtros y búsqueda -->
			<div class="library-filters">
				<div class="search-section">
					<AInput
						id="search-input"
						v-model="searchQuery"
						placeholder="Buscar por título o autor..."
						type="search"
						class="search-input"
						@input="handleSearch" />
				</div>

				<div class="filter-section">
					<div class="filter-group">
						<label for="sort-select" class="filter-label">Ordenar por:</label>
						<select id="sort-select" v-model="sortOption" class="filter-select" @change="handleFilterChange">
							<option value="">Sin ordenar</option>
							<option value="rating_desc">Calificación (mayor a menor)</option>
							<option value="rating_asc">Calificación (menor a mayor)</option>
						</select>
					</div>

					<div class="filter-group">
						<label class="filter-checkbox">
							<input v-model="onlyWithReview" type="checkbox" @change="handleFilterChange" />
							<span class="checkmark"></span>
							Solo libros con reseña
						</label>
					</div>

					<AButton variant="ghost" @click="clearFilters" class="clear-filters-btn"> Limpiar filtros </AButton>
				</div>
			</div>

			<!-- Loading state -->
			<div v-if="libraryStore.isLoading" class="loading-state">
				<p>Cargando biblioteca...</p>
			</div>

			<!-- Empty state -->
			<div v-else-if="libraryStore.books.length === 0" class="empty-state">
				<div class="empty-state__content">
					<h3>{{ hasActiveFilters ? "No se encontraron libros" : "Tu biblioteca está vacía" }}</h3>
					<p v-if="hasActiveFilters">Intenta cambiar los filtros de búsqueda</p>
					<p v-else>Comienza agregando libros desde la búsqueda</p>
					<AButton @click="navigateTo('/home')" class="empty-state__button"> Buscar libros </AButton>
				</div>
			</div>

			<!-- Books grid -->
			<div v-else class="books-grid">
				<MLibraryBookCard
					v-for="book in libraryStore.books"
					:key="book._id"
					:book="book"
					@edit="handleEditBook"
					@delete="handleDeleteBook" />
			</div>
		</div>

		<!-- Delete Confirmation Dialog -->
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

// Stores y composables
const libraryStore = useLibraryStore();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

// Estado de filtros
const searchQuery = ref("");
const sortOption = ref("");
const onlyWithReview = ref(false);

// Estado de modales
const isDeleteDialogOpen = ref(false);
const selectedBook = ref<any>(null);
const isDeleting = ref(false);

// Debounce para búsqueda
let searchTimeout: NodeJS.Timeout;

const hasActiveFilters = computed(() => {
	return searchQuery.value.trim() || sortOption.value || onlyWithReview.value;
});

// Funciones de manejo de filtros
const handleSearch = () => {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		libraryStore.setFilters({ q: searchQuery.value });
		loadBooks();
	}, 300);
};

const handleFilterChange = () => {
	libraryStore.setFilters({
		sort: sortOption.value as any,
		withReview: onlyWithReview.value,
	});
	loadBooks();
};

const clearFilters = () => {
	searchQuery.value = "";
	sortOption.value = "";
	onlyWithReview.value = false;
	libraryStore.clearFilters();
	loadBooks();
};

// Funciones de carga de datos
const loadBooks = async () => {
	try {
		await libraryStore.loadBooks(apiBase);
	} catch (error) {
		console.error("Error cargando biblioteca:", error);
	}
};

// Funciones de edición
const handleEditBook = (book: any) => {
	// Redirigir a la página del libro usando su ol_key
	if (book.ol_key) {
		const encodedKey = encodeURIComponent(book.ol_key);
		navigateTo(`/book/${encodedKey}`);
	}
};

// Funciones de eliminación
const handleDeleteBook = (book: any) => {
	selectedBook.value = book;
	isDeleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
	isDeleteDialogOpen.value = false;
	selectedBook.value = null;
};

const handleConfirmDelete = async () => {
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
	}
});
</script>

<style scoped lang="scss">
.library-page {
	padding: 2rem 0;
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
}

.empty-state {
	text-align: center;
	padding: 3rem 0;

	&__content {
		max-width: 400px;
		margin: 0 auto;

		h3 {
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
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;

	@media (min-width: 768px) {
		gap: 2rem;
	}
}

@media (max-width: 767px) {
	.library-page {
		padding: 1rem 0;
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
	}

	.books-grid {
		grid-template-columns: 1fr;
	}
}
</style>
