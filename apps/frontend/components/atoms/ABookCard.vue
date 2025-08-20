<template>
	<div class="book-card">
		<div class="book-card__cover">
			<img v-if="book.coverUrl" :src="book.coverUrl" :alt="`Portada de ${book.title}`" class="book-card__image" @error="onImageError" />
			<div v-else class="book-card__placeholder">
				<span>Sin portada</span>
			</div>
		</div>
		<div class="book-card__content">
			<h3 class="book-card__title">{{ book.title }}</h3>
			<p class="book-card__author">{{ book.author }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Book {
	title: string;
	author: string;
	coverUrl?: string;
	ol_key?: string;
}

defineProps<{
	book: Book;
}>();

const onImageError = (event: Event) => {
	const img = event.target as HTMLImageElement;
	img.style.display = "none";
	if (img.parentElement) {
		img.parentElement.innerHTML = "<span>Sin portada</span>";
		img.parentElement.className = "book-card__placeholder";
	}
};
</script>

<style scoped lang="scss">
.book-card {
	background: $surface;
	border: 1px solid $border;
	border-radius: 12px;
	overflow: hidden;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	cursor: pointer;

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
		margin: 0;
		font-size: 0.875rem;
		color: $text-muted;
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
}
</style>
