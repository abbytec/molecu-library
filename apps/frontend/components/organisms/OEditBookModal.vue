<template>
	<div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
		<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
			<div class="modal__header">
				<h2 id="modal-title" class="modal__title">Editar libro</h2>
				<button type="button" class="modal__close" @click="handleCancel" aria-label="Cerrar modal">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div v-if="book" class="modal__content">
				<div class="book-info">
					<h3 class="book-info__title">{{ book.title }}</h3>
					<p class="book-info__author">{{ book.author }}</p>
					<p v-if="book.year" class="book-info__year">{{ book.year }}</p>
				</div>

				<form @submit.prevent="handleSave" class="edit-form">
					<div class="form-group">
						<label for="rating" class="form-label">Calificación</label>
						<ARating v-model="formData.rating" :show-label="true" class="form-rating" />
					</div>

					<div class="form-group">
						<label for="review" class="form-label">Mi reseña</label>
						<ATextarea v-model="formData.review" placeholder="Escribe tu reseña del libro..." :rows="6" class="form-textarea" />
					</div>

					<div class="modal__actions">
						<AButton variant="ghost" type="button" @click="handleCancel"> Cancelar </AButton>
						<AButton type="submit" :disabled="isLoading">
							{{ isLoading ? "Guardando..." : "Guardar cambios" }}
						</AButton>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import AButton from "../atoms/AButton.vue";
import ATextarea from "../atoms/ATextarea.vue";
import ARating from "../atoms/ARating.vue";
import { reactive, watch, onMounted, onUnmounted } from "vue";

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

interface Props {
	isOpen: boolean;
	book: LibraryBook | null;
	isLoading?: boolean;
}

interface Emits {
	close: [];
	save: [data: { review: string; rating: number }];
}

const props = withDefaults(defineProps<Props>(), {
	isLoading: false,
});

const emit = defineEmits<Emits>();

const formData = reactive({
	rating: 0,
	review: "",
});

// Inicializar formulario cuando se abre el modal
watch(
	() => props.book,
	(newBook) => {
		if (newBook) {
			formData.rating = newBook.rating || 0;
			formData.review = newBook.review || "";
		}
	},
	{ immediate: true }
);

const handleSave = () => {
	emit("save", {
		rating: formData.rating,
		review: formData.review.trim(),
	});
};

const handleCancel = () => {
	emit("close");
};

const handleOverlayClick = (event: Event) => {
	// Solo cerrar si se hace clic directamente en el overlay
	if (event.target === event.currentTarget) {
		handleCancel();
	}
};

// Cerrar modal con la tecla Escape
onMounted(() => {
	const handleEscape = (event: KeyboardEvent) => {
		if (event.key === "Escape" && props.isOpen) {
			handleCancel();
		}
	};

	document.addEventListener("keydown", handleEscape);

	onUnmounted(() => {
		document.removeEventListener("keydown", handleEscape);
	});
});
</script>

<style scoped lang="scss">
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
}

.modal {
	background: $surface;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	position: relative;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0 1.5rem;
		border-bottom: 1px solid $border;
		margin-bottom: 1.5rem;
	}

	&__title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: $text;
	}

	&__close {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: $text-muted;
		border-radius: 6px;
		transition: background-color 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.1);
			color: $text;
		}

		svg {
			display: block;
		}
	}

	&__content {
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	&__actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
}

.book-info {
	background: $surface-alt;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 1.5rem;

	&__title {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: $text;
	}

	&__author {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: $text-muted;
	}

	&__year {
		margin: 0;
		font-size: 0.875rem;
		color: $text-muted;
		font-weight: 500;
	}
}

.edit-form {
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: $text;
	}

	.form-rating {
		margin-top: 0.25rem;
	}

	.form-textarea {
		width: 100%;
		resize: vertical;
		min-height: 120px;
	}
}
</style>
