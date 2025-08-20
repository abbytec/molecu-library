<script setup lang="ts">
defineProps<{
	id: string;
	modelValue: string;
	type?: string;
	placeholder?: string;
}>();

const emit = defineEmits<(e: "update:modelValue", v: string) => void>();
</script>

<template>
	<input
		:id="id"
		:type="type || 'text'"
		:placeholder="placeholder"
		class="a-input"
		:value="modelValue"
		@input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>

<style scoped lang="scss">
.a-input {
	width: 100%;
	border: 1px solid $border;
	border-radius: 5px;
	font-size: 1rem;
	background: $surface-alt;
	height: 2rem;
	padding: 8px;
	&:focus {
		outline: 2px solid $divider;
		outline-offset: 1px;
	}
}
</style>
