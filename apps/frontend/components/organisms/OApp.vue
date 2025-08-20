<template>
	<div>
		<MHeaderBar />

		<main class="app-main">
			<AContainer>
				<slot />
			</AContainer>
		</main>
		<ONotificationContainer />
	</div>
</template>
<script setup lang="ts">
import MHeaderBar from "@/components/molecules/MHeaderBar.vue";
import AContainer from "@/components/atoms/AContainer.vue";
import ONotificationContainer from "@/components/organisms/ONotificationContainer.vue";
</script>
<style scoped lang="scss">
.app-main {
	padding: 1rem 0 2rem;
}
</style>
