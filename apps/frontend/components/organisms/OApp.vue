<template>
	<div>
		<MHeaderBar />

		<main class="app-main">
			<AContainer>
				<slot />
			</AContainer>
		</main>
	</div>
</template>
<script setup lang="ts">
import MHeaderBar from "@/components/molecules/MHeaderBar.vue";
import AContainer from "@/components/atoms/AContainer.vue";
</script>
<style scoped lang="scss">
.app-main {
	padding: 1rem 0 2rem;
}
</style>
