<template>
	<header class="app-header">
		<AContainer>
			<div class="app-header__inner">
				<div>
					<slot name="brand">
						<NuxtLink to="/home" aria-label="Ir al inicio" class="link-btn">📚 Book Reviews</NuxtLink>
					</slot>
				</div>
				<div>
					<!-- Botón fijo: Mi biblioteca -->
					<ALink to="/library">Mi biblioteca</ALink>
				</div>
			</div>
		</AContainer>
	</header>
</template>
<script setup lang="ts">
import AContainer from "@/components/atoms/AContainer.vue";
import ALink from "@/components/atoms/ALink.vue";
</script>
<style scoped lang="scss">
.app-header {
	background: $header-bg;
	border-bottom: 1px solid $divider;
}
.app-header__inner {
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
</style>
