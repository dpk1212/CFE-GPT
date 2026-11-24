export const GOOGLE_REDIRECT_URIS = {
  production: "https://cfe-epp.vercel.app/api/auth/google/callback",
  local: "http://localhost:3000/api/auth/google/callback",
} as const;

export const GOOGLE_SCOPES = "openid email profile";

export function googleHost(host: string) {
  return host.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function googlePublicOrigin(host: string) {
  const name = googleHost(host);
  if (name === "localhost:3000" || name === "127.0.0.1:3000") return `http://${name}`;
  return "https://cfe-epp.vercel.app";
}

export function googleRedirectUri(host: string) {
  const name = googleHost(host);
  if (name === "localhost:3000" || name === "127.0.0.1:3000") return GOOGLE_REDIRECT_URIS.local;
  return GOOGLE_REDIRECT_URIS.production;
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}
