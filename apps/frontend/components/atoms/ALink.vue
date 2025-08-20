<template>
	<NuxtLink class="link-btn" :to="to">
		<slot />
	</NuxtLink>
</template>
<script setup lang="ts">
defineProps<{ to: string }>();
</script>
<style scoped lang="scss">
.link-btn {
	color: $text;
	font-weight: 600;
}
.link-btn:hover {
	color: $link-hover;
}
</style>
