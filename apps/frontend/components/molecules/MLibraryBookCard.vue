<template>
	<div class="library-book-card">
		<div class="library-book-card__cover">
			<img
				v-if="book.coverUrl"
				:src="book.coverUrl"
				:alt="`Portada de ${book.title}`"
				class="library-book-card__image"
				@error="onImageError" />
			<div v-else class="library-book-card__placeholder">
				<span>Sin portada</span>
			</div>
		</div>

		<div class="library-book-card__content">
			<h3 class="library-book-card__title">{{ book.title }}</h3>
			<p class="library-book-card__author">{{ book.author }}</p>
			<p v-if="book.year" class="library-book-card__year">{{ book.year }}</p>

			<div v-if="book.rating" class="library-book-card__rating">
				<ARating :model-value="book.rating" :disabled="true" :show-label="false" />
				<span class="library-book-card__rating-label">{{ getRatingLabel(book.rating) }}</span>
			</div>

			<div v-if="book.review" class="library-book-card__review">
				<h4 class="library-book-card__review-title">Mi reseña:</h4>
				<p class="library-book-card__review-text">{{ book.review }}</p>
			</div>
		</div>

		<div class="library-book-card__actions">
			<AButton @click="$emit('edit', book)"> Editar </AButton>
			<ADangerButton @click="$emit('delete', book)"> Eliminar </ADangerButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import AButton from "../atoms/AButton.vue";
import ADangerButton from "../atoms/ADangerButton.vue";
import ARating from "../atoms/ARating.vue";
import type { BookWithId } from "shared";

const props = defineProps<{
	book: BookWithId;
}>();

const emit = defineEmits<{
	edit: [book: BookWithId];
	delete: [book: BookWithId];
}>();

const ratingLabels = {
	1: "Muy malo",
	2: "Malo",
	3: "Regular",
	4: "Bueno",
	5: "Excelente",
};

const getRatingLabel = (rating: number) => {
	return ratingLabels[rating as keyof typeof ratingLabels] || "";
};

const onImageError = (event: Event) => {
	const img = event.target as HTMLImageElement;
	img.style.display = "none";
	if (img.parentElement) {
		img.parentElement.innerHTML = "<span>Sin portada</span>";
		img.parentElement.className = "library-book-card__placeholder";
	}
};
</script>

<style scoped lang="scss">
.library-book-card {
	background: $surface;
	border: 1px solid $border;
	border-radius: 12px;
	overflow: hidden;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	display: flex;
	flex-direction: column;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	&__cover {
		width: 100%;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $surface-alt;
		position: relative;
	}

	&__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	&__placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: $text-muted;
		font-size: 0.875rem;
		background: linear-gradient(135deg, $surface-alt 0%, darken($surface-alt, 5%) 100%);
	}

	&__content {
		padding: 1rem;
		flex: 1;
	}

	&__title {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: $text;
		line-height: 1.3;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__author {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		color: $text-muted;
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__year {
		margin: 0 0 1rem 0;
		font-size: 0.75rem;
		color: $text-muted;
		font-weight: 500;
	}

	&__rating {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	&__rating-label {
		font-size: 0.875rem;
		color: $text-muted;
		font-weight: 500;
	}

	&__review {
		margin-top: 1rem;

		&-title {
			margin: 0 0 0.5rem 0;
			font-size: 0.875rem;
			font-weight: 600;
			color: $text;
		}

		&-text {
			margin: 0;
			font-size: 0.875rem;
			color: $text-muted;
			line-height: 1.4;
			display: -webkit-box;
			line-clamp: 3;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}
	}

	&__actions {
		padding: 1rem;
		display: flex;
		gap: 0.5rem;
		border-top: 1px solid $border;
		background: $surface-alt;
	}
}
</style>
