export default defineEventHandler(() => {
	return {
		ok: true,
		service: "frontend",
		timestamp: new Date().toISOString(),
	};
});
