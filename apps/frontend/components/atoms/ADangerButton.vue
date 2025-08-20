<template>
	<button class="btn btn--danger" :type="type" @click="$emit('click', $event)" :disabled="disabled">
		<slot />
	</button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ 
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
}>();

const type = computed(() => props.type ?? "button");
</script>

<style scoped lang="scss">
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	height: 38px;
	padding: 0 14px;
	border: 1px solid transparent;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 600;
	font-size: 0.875rem;
	transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&--danger {
		background: $danger;
		color: $text-inverse;
		border-color: $danger;

		&:hover:not(:disabled) {
			background: darken($danger, 10%);
			border-color: darken($danger, 10%);
		}

		&:focus {
			outline: 2px solid $danger;
			outline-offset: 2px;
		}
	}
}
</style> 