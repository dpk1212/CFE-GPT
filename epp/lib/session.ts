export const SESSION_COOKIE = "epp_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 90;
const SLIDE_AFTER_MS = (SESSION_SECONDS - 60 * 60 * 24) * 1000;

export type Session = {
  email: string;
  role: "admin" | "judge";
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required");
  return "dev-only-secret";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function sealSession(session: Omit<Session, "exp">) {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ ...session, exp: Date.now() + SESSION_SECONDS * 1000 })));
  return `${payload}.${await sign(payload)}`;
}

export async function openSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await sign(payload);
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  if (mismatch !== 0) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as Session;
    if (!parsed.email || (parsed.role !== "admin" && parsed.role !== "judge") || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionShouldSlide(session: Session) {
  return session.exp - Date.now() < SLIDE_AFTER_MS;
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
