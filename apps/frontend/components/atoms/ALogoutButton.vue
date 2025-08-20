<template>
	<button class="btn btn--logout" type="button" @click="handleLogout" :disabled="loading">
		<span v-if="!loading">{{ label }}</span>
		<span v-else>Cerrando sesión...</span>
	</button>
</template>

<script setup lang="ts">
interface Props {
	label?: string;
}

withDefaults(defineProps<Props>(), {
	label: "Cerrar sesión",
});

const loading = ref(false);
const authStore = useAuthStore();
const config = useRuntimeConfig();

const handleLogout = async () => {
	loading.value = true;
	try {
		await authStore.logout(config.public.apiBase);
		await navigateTo("/");
	} catch (error) {
		console.error("Error al cerrar sesión:", error);
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped lang="scss">
.btn {
	--btn-bg: transparent;
	--btn-bg-hover: rgba(185, 28, 28, 0.08);
	--btn-color: #{$danger};
	--btn-border: #{$danger};

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
	transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
	background: var(--btn-bg-hover);
}

.btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.btn--logout {
	font-size: 0.875rem;
}
</style>
