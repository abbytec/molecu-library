<script setup lang="ts">
import MLoginFrom from "~/components/molecules/MLoginFrom.vue";
definePageMeta({
	layout: "auth",
});
</script>

<template>
	<main>
		<MLoginFrom />
	</main>
</template>

<style scoped lang="scss">
input,
button {
	padding: 8px;
}
button {
	cursor: pointer;
}
</style>
