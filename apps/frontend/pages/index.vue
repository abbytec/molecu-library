<script setup lang="ts">
const { post, get } = useApi();
const username = ref("");
const password = ref("");
const message = ref("");

async function login() {
	message.value = "";
	try {
		await post("/auth/login", { username: username.value, password: password.value });
		message.value = "¡Login OK! Cookie de sesión establecida.";
	} catch (e: any) {
		message.value = "Credenciales inválidas";
	}
}

async function testMe() {
	message.value = "";
	try {
		const me = await get<{ ok: boolean; user?: { username: string } }>("/auth/me");
		message.value = me.ok ? `Sesión válida como ${me.user!.username}` : "Sesión no válida";
	} catch {
		message.value = "Sesión no válida";
	}
}
</script>

<template>
	<main style="max-width: 360px; margin: 20vh auto 0; display: flex; flex-direction: column; gap: 12px">
		<h1 style="text-align: center">Login</h1>
		<input v-model="username" placeholder="Usuario" />
		<input v-model="password" type="password" placeholder="Contraseña" />
		<button @click="login">Entrar</button>
		<button @click="testMe">Probar sesión (/auth/me)</button>
		<p style="min-height: 1.5em; text-align: center">{{ message }}</p>
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
