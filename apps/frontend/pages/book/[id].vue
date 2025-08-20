<template>
	<div class="book-detail-page">
		<div class="container">
			<!-- Botón de regreso -->
			<div class="book-detail-page__header">
				<button class="btn btn--ghost" @click="handleGoBack">
					← {{ canGoBackToResults ? `Volver a resultados de "${bookSearchStore.searchQuery}"` : "Volver" }}
				</button>
			</div>

			<!-- Contenido principal -->
			<div v-if="bookData" class="book-detail-page__content">
				<!-- Portada y información básica -->
				<div class="book-detail-page__main">
					<div class="book-detail-page__cover">
						<img
							v-if="bookData.coverUrl"
							:src="bookData.coverUrl"
							:alt="`Portada de ${bookData.title}`"
							class="book-detail-page__image"
							@error="onImageError" />
						<div v-else class="book-detail-page__placeholder">
							<span>Sin portada disponible</span>
						</div>
					</div>

					<div class="book-detail-page__info">
						<h1 class="book-detail-page__title">{{ bookData?.title || "Título desconocido" }}</h1>
						<p class="book-detail-page__author">por {{ bookData?.author || "Autor desconocido" }}</p>
						<p v-if="bookData.year" class="book-detail-page__year">Año de publicación: {{ bookData.year }}</p>
					</div>
				</div>

				<!-- Formulario de review y rating -->
				<div class="book-detail-page__form">
					<h2 class="book-detail-page__form-title">Agregar a mi biblioteca</h2>

					<div class="book-detail-page__form-content">
						<!-- Rating -->
						<div class="book-detail-page__field">
							<label class="book-detail-page__field-label">Calificación</label>
							<div class="rating">
								<button
									v-for="star in 5"
									:key="star"
									type="button"
									class="rating__star"
									:class="{ 'rating__star--filled': star <= formData.rating }"
									@click="formData.rating = star">
									⭐
								</button>
								<span class="rating__label">
									{{ formData.rating === 0 ? "Sin calificación" : `${formData.rating}/5` }}
								</span>
							</div>
						</div>

						<!-- Review -->
						<div class="book-detail-page__field">
							<label class="book-detail-page__field-label">Reseña personal</label>
							<textarea
								v-model="formData.review"
								placeholder="Escribe aquí tu opinión sobre este libro..."
								maxlength="500"
								rows="6"
								class="book-detail-page__textarea" />
							<div class="book-detail-page__counter">{{ formData.review.length }}/500 caracteres</div>
						</div>

						<!-- Botón guardar -->
						<div class="book-detail-page__actions">
							<button
								@click="handleSaveBook"
								:disabled="bookStore.isLoading || !canSave"
								class="book-detail-page__save-btn btn btn--primary">
								{{ bookStore.isLoading ? "Guardando..." : "Guardar en mi biblioteca" }}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Estado de carga al fetchear libro -->
			<div v-else-if="isLoadingBook" class="book-detail-page__loading">
				<div class="book-detail-page__spinner"></div>
				<p>Cargando información del libro...</p>
			</div>

			<!-- Error al cargar -->
			<div v-else-if="fetchError" class="book-detail-page__error">
				<div class="book-detail-page__error-content">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
					</svg>
					<h3>Error al cargar el libro</h3>
					<p>{{ fetchError }}</p>
					<p class="book-detail-page__error-redirect">Redirigiendo al inicio en unos segundos...</p>
				</div>
			</div>

			<!-- Fallback si no hay datos -->
			<div v-else class="book-detail-page__loading">
				<p>Cargando detalles del libro...</p>
			</div>
		</div>
	</div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

// Importar stores dinámicamente para evitar errores de TypeScript
const { useBookStore } = await import("~/stores/useBookStore");
const { useBookSearchStore } = await import("~/stores/useBookSearchStore");
const bookStore = useBookStore();
const bookSearchStore = useBookSearchStore();

const formData = ref({
	rating: 0,
	review: "",
});

const isLoadingBook = ref(false);
const fetchError = ref(null);

// Usar el libro del store de Pinia
const bookData = computed(() => bookStore.selectedBook);

// Función para fetchear libro por ol_key
const fetchBookByKey = async (ol_key) => {
	isLoadingBook.value = true;
	fetchError.value = null;

	try {
		const response = await $fetch(`${config.public.apiBase}/books/by-key/${encodeURIComponent(ol_key)}`, {
			credentials: "include",
		});

		if (response.ok && response.book) {
			// Guardar el libro en el store
			bookStore.setSelectedBook(response.book);
			return response.book;
		} else {
			throw new Error("Libro no encontrado");
		}
	} catch (error) {
		console.error("Error fetching book:", error);
		fetchError.value = error.message || "Error al cargar el libro";
		return null;
	} finally {
		isLoadingBook.value = false;
	}
};

onMounted(async () => {
	// Decodificar la key de la URL (maneja caracteres especiales como slashes)
	const encodedId = route.params.id;
	const decodedId = decodeURIComponent(encodedId);

	// Si no hay libro en el store, intentar fetchearlo
	if (!bookData.value) {
		if (decodedId && decodedId !== "unknown") {
			const fetchedBook = await fetchBookByKey(decodedId);
			if (!fetchedBook) {
				// Si no se pudo obtener el libro, redirigir al home después de un momento
				setTimeout(() => {
					router.push("/home");
				}, 2000);
			}
		} else {
			// Si no hay ol_key válida, redirigir inmediatamente
			router.push("/home");
		}
		return;
	}

	// Verificar que el libro del store coincida con la URL (opcional)
	const bookKey = bookData.value.ol_key;
	if (bookKey && bookKey !== decodedId && decodedId !== "unknown") {
		console.warn("Book key mismatch between store and URL");
	}
});

const canSave = computed(() => {
	return formData.value.rating > 0 || formData.value.review.trim().length > 0;
});

const canGoBackToResults = computed(() => bookSearchStore.canGoBack);

const handleGoBack = () => {
	if (canGoBackToResults.value && bookSearchStore.hasResults) {
		// Volver a los resultados de búsqueda sin hacer nueva API call
		router.push("/home");
	} else {
		// Navegación normal hacia atrás
		router.back();
	}
};

const handleSaveBook = async () => {
	if (!canSave.value || !bookData.value) return;

	try {
		await bookStore.saveBookToLibrary(config.public.apiBase, {
			ol_key: bookData.value.ol_key || `manual_${Date.now()}`,
			title: bookData.value.title,
			author: bookData.value.author,
			year: bookData.value.year,
			review: formData.value.review.trim(),
			rating: formData.value.rating,
			coverId: bookData.value.coverId,
			coverUrl: bookData.value.coverUrl,
		});
	} catch (error) {
		console.error("Error al guardar el libro:", error);
	}
};

const onImageError = (event) => {
	const img = event.target;
	img.style.display = "none";
	if (img.parentElement) {
		img.parentElement.innerHTML = "<span>Imagen no disponible</span>";
		img.parentElement.className = "book-detail-page__placeholder";
	}
};

definePageMeta({
	layout: "default",
});
useHead(() => {
	const title = bookData.value?.title || "Detalle de libro";
	const author = bookData.value?.author || "Desconocido";

	return {
		title: `${title} - Molecu Library`,
		meta: [
			{
				name: "author",
				content: author,
			},
		],
	};
});
</script>

<style scoped lang="scss">
.book-detail-page {
	min-height: 100vh;
	padding: 2rem 0;

	&__header {
		margin-bottom: 2rem;
	}

	&__content {
		background: $surface;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	&__main {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 2rem;
		margin-bottom: 3rem;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
			text-align: center;
		}
	}

	&__cover {
		position: relative;
	}

	&__image {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	&__placeholder {
		width: 100%;
		height: 300px;
		border-radius: 12px;
		background: linear-gradient(135deg, $surface-alt 0%, darken($surface-alt, 5%) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: $text-muted;
		font-size: 0.875rem;
		text-align: center;
		border: 2px dashed $border;
	}

	&__info {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
	}

	&__title {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: $text;
		line-height: 1.2;

		@media (max-width: 768px) {
			font-size: 1.5rem;
		}
	}

	&__author {
		margin: 0;
		font-size: 1.25rem;
		color: $text-muted;
		font-weight: 500;
	}

	&__year {
		margin: 0;
		font-size: 1rem;
		color: $text-muted;
	}

	&__form {
		border-top: 1px solid $border;
		padding-top: 2rem;
	}

	&__form-title {
		margin: 0 0 2rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: $text;
	}

	&__form-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	&__field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		&-label {
			font-size: 1rem;
			font-weight: 600;
			color: $text;
		}
	}

	&__actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 1rem;
	}

	&__save-btn {
		min-width: 200px;
		height: 48px;
		font-size: 1rem;
		font-weight: 600;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	&__loading {
		text-align: center;
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
		margin: 0 auto 1rem;
	}

	&__error {
		text-align: center;
		padding: 3rem;

		&-content {
			max-width: 400px;
			margin: 0 auto;

			svg {
				color: $danger;
				margin-bottom: 1rem;
			}

			h3 {
				color: $text;
				margin: 0 0 1rem 0;
				font-size: 1.5rem;
			}

			p {
				color: $text-muted;
				margin: 0.5rem 0;

				&.book-detail-page__error-redirect {
					font-size: 0.875rem;
					font-style: italic;
					margin-top: 1.5rem;
				}
			}
		}
	}

	&__textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid $border;
		border-radius: 8px;
		background: $surface;
		color: $text;
		font-size: 1rem;
		line-height: 1.5;
		resize: vertical;
		min-height: 120px;
		font-family: inherit;

		&:focus {
			outline: none;
			border-color: $primary;
			box-shadow: 0 0 0 3px rgba($primary, 0.1);
		}

		&::placeholder {
			color: $text-muted;
		}
	}

	&__counter {
		font-size: 0.75rem;
		color: $text-muted;
		text-align: right;
		margin-top: 0.25rem;
	}
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1rem;
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid transparent;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	text-decoration: none;

	&--primary {
		background: $primary;
		color: $text-inverse;

		&:hover:not(:disabled) {
			background: $primary-600;
		}
	}

	&--ghost {
		background: transparent;
		color: $text;
		border-color: $border;

		&:hover:not(:disabled) {
			background: rgba(0, 0, 0, 0.06);
		}
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
}

.rating {
	display: flex;
	align-items: center;
	gap: 0.5rem;

	&__star {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		opacity: 0.3;
		transition: opacity 0.2s ease, transform 0.1s ease;

		&:hover {
			transform: scale(1.1);
		}

		&--filled {
			opacity: 1;
		}
	}

	&__label {
		font-size: 0.875rem;
		color: $text-muted;
		margin-left: 0.5rem;
	}
}

@keyframes slideDown {
	from {
		transform: translateY(-100%);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
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
