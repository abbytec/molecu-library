import { createHmac, timingSafeEqual } from "crypto";

const enc = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const dec = (s: string) => Buffer.from(s, "base64url").toString("utf8");

export function signSession(username: string, secret: string, ttlSec = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSec;
  const payload = JSON.stringify({ sub: username, iat: now, exp });
  const b64 = enc(payload);
  const sig = createHmac("sha256", secret).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySession(token: string, secret: string) {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const expected = createHmac("sha256", secret).update(b64).digest("base64url");
  const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  const payload = JSON.parse(dec(b64));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
