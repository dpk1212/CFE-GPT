/** The only host users should see. Never build a link from VERCEL_URL. */
export const APP_HOST = "cfe-epp.vercel.app";
export const APP_URL = "https://cfe-epp.vercel.app";

export function canonicalUrl(path = "/") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${suffix}`;
}

/**
 * On the production deployment, every other host (including the per-deployment
 * *.vercel.app URL) belongs on the public alias. Preview and local hosts stay put.
 */
export function productionCanonicalUrl(host: string | null, path = "/", vercelEnv = process.env.VERCEL_ENV) {
  if (vercelEnv !== "production") return null;
  const name = (host || "").split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
  if (!name || name === APP_HOST) return null;
  return canonicalUrl(path);
}
