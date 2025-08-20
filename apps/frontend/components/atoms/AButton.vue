<template>
	<button class="btn" :class="variantClass" :type="type" @click="$emit('click', $event)">
		<slot />
	</button>
</template>

<script setup lang="ts">
const props = defineProps<{ variant?: "primary" | "ghost"; type?: "button" | "submit" | "reset" }>();
const variantClass = computed(() => (props.variant === "ghost" ? "btn--ghost" : ""));
const type = computed(() => props.type ?? "button");
</script>
<style scoped lang="scss">
.btn {
	--btn-bg: #{$primary};
	--btn-bg-hover: #{$primary-600};
	--btn-color: #{$text-inverse};
	--btn-border: transparent;

	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	height: 38px;
	padding: 0 14px;
	background: var(--btn-bg);
	color: var(--btn-color);
	border: 1px solid var(--btn-border);
	border-radius: 8px;
	cursor: pointer;
	font-weight: 600;
}
.btn:hover {
	background: var(--btn-bg-hover);
}
.btn--ghost {
	--btn-bg: transparent;
	--btn-bg-hover: rgba(0, 0, 0, 0.06);
	--btn-color: #{$text};
	--btn-border: #{$border};
}
</style>
