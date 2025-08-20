<script setup lang="ts">
import MLoginFrom from "~/components/molecules/MLoginFrom.vue";
definePageMeta({
	layout: "auth",
});
useHead({
	title: "Molecu Library",
	meta: [
		{
			name: "description",
			content: "Logueate y descubre libros usando nuestra búsqueda avanzada. Explora miles de títulos y construye tu biblioteca personal.",
		},
		{
			name: "keywords",
			content: "buscar libros, biblioteca digital, catálogo libros, descubrir lecturas",
		},
	],
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
