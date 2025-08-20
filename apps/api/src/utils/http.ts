// Respuestas JSON y helpers HTTP
export function sendJSON(res: any, status: number, data: any) {
	const body = JSON.stringify(data);
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Content-Length", Buffer.byteLength(body));
	res.end(body);
	return null; // <- importante: ya respondimos y el stream queda cerrado
}

export function sendText(res: any, status: number, text: string) {
	res.statusCode = status;
	res.setHeader("Content-Type", "text/plain; charset=utf-8");
	res.setHeader("Content-Length", Buffer.byteLength(text));
	res.end(text);
	return null;
}
