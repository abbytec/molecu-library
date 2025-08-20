<template>
	<AContainer>
		<!-- Mejora 1: Estructura semántica y accesibilidad -->
		<main class="home-page" role="main" aria-label="Búsqueda de libros">
			<OBookSearchPage />
		</main>
	</AContainer>
</template>

<script setup lang="ts">
import OBookSearchPage from "~/components/organisms/OBookSearchPage.vue";
import AContainer from "~/components/atoms/AContainer.vue";
interface PageMeta {
	title: string;
	description: string;
	keywords?: string;
}

useHead({
	title: "Buscar Libros - Molecu Library",
	meta: [
		{
			name: "description",
			content:
				"Encuentra y descubre libros usando nuestra búsqueda avanzada. Explora miles de títulos y construye tu biblioteca personal.",
		},
		{
			name: "keywords",
			content: "buscar libros, biblioteca digital, catálogo libros, descubrir lecturas",
		},
	],
});
</script>

<style scoped lang="scss">
.home-page {
	min-height: calc(100vh - 120px);
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	padding: 1rem 0;

	@media (min-width: 768px) {
		padding: 2rem 0;
	}

	@media (min-width: 1024px) {
		padding: 3rem 0;
	}
	*:focus {
		outline: 2px solid $primary;
		outline-offset: 2px;
	}
}
</style>
