<template>
	<div v-if="searches.length > 0" class="recent-searches">
		<h3 class="recent-searches__title">Búsquedas recientes</h3>
		<div class="recent-searches__list">
			<button v-for="(search, index) in searches" :key="index" @click="handleSearchClick(search)" class="recent-searches__item">
				"{{ search }}"
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
type Emits = (e: "searchClick", query: string) => void;

const emit = defineEmits<Emits>();

defineProps<{
	searches: string[];
}>();

const handleSearchClick = (query: string) => {
	emit("searchClick", query);
};
</script>

<style scoped lang="scss">
.recent-searches {
	width: 100%;
	max-width: 600px;
	margin: 2rem auto 0;

	&__title {
		font-size: 1.125rem;
		font-weight: 600;
		color: $text;
		margin: 0 0 1rem 0;
		text-align: center;
	}

	&__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	&__item {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: $surface;
		border: 1px solid $border;
		border-radius: 20px;
		color: $text-muted;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;

		&:hover {
			background: $primary-100;
			border-color: $primary;
			color: $primary-700;
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}
	}
}
</style>
