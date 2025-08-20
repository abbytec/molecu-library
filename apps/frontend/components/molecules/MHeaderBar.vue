<template>
	<header class="app-header">
		<AContainer>
			<div class="app-header__inner">
				<div class="u-flex u-items-center u-gap-3">
					<slot name="brand">
						<NuxtLink to="/" aria-label="Ir al inicio" class="link-btn">📚 Book Reviews</NuxtLink>
					</slot>
				</div>
				<div class="u-flex u-items-center u-gap-3">
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
