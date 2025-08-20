import axios from "axios";

export async function fetchAsBase64(url: string): Promise<string> {
  const resp = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
  const ct = resp.headers["content-type"] || "image/jpeg";
  const b64 = Buffer.from(resp.data).toString("base64");
  return `data:${ct};base64,${b64}`;
}
