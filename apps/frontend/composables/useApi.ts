export function useApi() {
  const config = useRuntimeConfig();
  const base = config.public.apiBase;

  async function post<T>(url: string, body: any): Promise<T> {
    const res = await fetch(`${base}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include" // Nota: importante para recibir/enviar cookies
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function get<T>(url: string): Promise<T> {
    const res = await fetch(`${base}${url}`, { credentials: "include" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  return { get, post };
}
