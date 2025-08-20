<template>
	<div class="book-search">
		<div class="book-search__form u-flex u-gap-3">
			<AInput
				id="search-input"
				v-model="searchQuery"
				type="text"
				placeholder="Escribe el nombre de un Libro para continuar"
				class="book-search__input"
				@keyup.enter="handleSearch" />
			<AButton @click="handleSearch" :disabled="!searchQuery.trim() || isLoading" class="book-search__button">
				{{ isLoading ? "Buscando..." : "Buscar" }}
			</AButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import AInput from "../atoms/AInput.vue";
import AButton from "../atoms/AButton.vue";
import { ref } from "vue";

type Emits = (e: "search", query: string) => void;

const emit = defineEmits<Emits>();

const props = defineProps<{
	isLoading?: boolean;
}>();

const searchQuery = ref("");

const handleSearch = () => {
	const query = searchQuery.value.trim();
	if (query) {
		emit("search", query);
	}
};

// Método para establecer una búsqueda desde el exterior (para búsquedas recientes)
const setSearch = (query: string) => {
	searchQuery.value = query;
};

defineExpose({
	setSearch,
});
</script>

<style scoped lang="scss">
.book-search {
	width: 100%;
	max-width: 600px;
	margin: 0 auto;

	&__form {
		align-items: stretch;
		width: 100%;

		@media (max-width: 640px) {
			flex-direction: column;
		}
	}

	&__input {
		flex: 1;
		height: 48px;
		font-size: 1.1rem;
		padding: 0 1rem;
		border-radius: 12px;
		border: 2px solid $border;
		background: $surface;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;

		&:focus {
			border-color: $primary;
			box-shadow: 0 0 0 3px rgba($primary, 0.1);
			outline: none;
		}

		&::placeholder {
			color: $text-muted;
		}
	}

	&__button {
		height: 48px;
		min-width: 120px;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.2s ease;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none !important;
		}

		&:not(:disabled):hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba($primary, 0.3);
		}

		@media (max-width: 640px) {
			width: 100%;
		}
	}
}
</style>
