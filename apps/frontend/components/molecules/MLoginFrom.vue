<script setup lang="ts">
import AInput from "../atoms/AInput.vue";
import AButton from "../atoms/AButton.vue";
import { useAuthStore } from "~/stores/useAuthStore";
const router = useRouter();
const { post, get } = useApi();
const username = ref("");
const password = ref("");
const errMessage = ref("");
const authStore = useAuthStore();
const {
	public: { apiBase },
} = useRuntimeConfig();

async function login() {
	try {
		await authStore.login(apiBase, username.value, password.value);
		router.replace("/home");
	} catch (e: any) {
		console.error(e);
		errMessage.value = "Credenciales inválidas";
	}
}

/*
async function testMe() {
	message.value = "";
	try {
		const me = await get<{ ok: boolean; user?: { username: string } }>("/auth/me");
		message.value = me.ok ? `Sesión válida como ${me.user!.username}` : "Sesión no válida";
	} catch {
		message.value = "Sesión no válida";
	}
}
*/
</script>

<template>
	<span style="max-width: 360px; margin: 20vh auto 0; display: flex; flex-direction: column; gap: 12px">
		<h1 class="u-text-center">Login</h1>
		<AInput id="username" v-model="username" placeholder="Usuario" />
		<AInput id="password" v-model="password" type="password" placeholder="Contraseña" />
		<AButton @click="login">Entrar</AButton>
		<!-- <AButton @click="testMe">Probar sesión (/auth/me)</AButton> -->
		<p class="u-text-center err-message">{{ errMessage }}</p>
	</span>
</template>

<style scoped lang="scss">
.err-message {
	color: $danger;
	min-height: 1.5em;
}
</style>
