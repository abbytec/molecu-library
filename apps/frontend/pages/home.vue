<template>
	<AContainer>
		<OBookSearchPage />
	</AContainer>
</template>

<script setup lang="ts">
import OBookSearchPage from "~/components/organisms/OBookSearchPage.vue";
import AContainer from "~/components/atoms/AContainer.vue";
useHead({
	title: "Buscar Libros - Molecu Library",
});
</script>
