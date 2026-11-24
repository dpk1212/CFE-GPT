import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FuelApplication } from "@/lib/fuelJudge/types";

const TOKEN_BLOB = "epp/zoho-token.json";
const CATALOG_BLOB = "epp/zoho-catalog.json";
const FRESH_MS = 5 * 60 * 1000;
const BACKOFF_MS = 12 * 60 * 1000;
const LOCK_MS = 20 * 1000;

export class ZohoTokenError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export class ZohoRateLimitError extends ZohoTokenError {
  applications: FuelApplication[];
  constructor(applications: FuelApplication[] = []) {
    super("CRM syncing", 503);
    this.applications = applications;
  }
}

type TokenRecord = {
  accessToken?: string;
  expiresAt?: number;
  refreshLockId?: string;
  refreshLockUntil?: number;
  backoffUntil?: number;
};

type CatalogRecord = {
  admin?: FuelApplication[];
  judge?: FuelApplication[];
  at?: string;
};

type Deps = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  fetch: typeof fetch;
  env: (name: string) => string | undefined;
  readToken: () => Promise<TokenRecord>;
  writeToken: (record: TokenRecord) => Promise<void>;
  readCatalog: () => Promise<CatalogRecord>;
  writeCatalog: (record: CatalogRecord) => Promise<void>;
};

let memory: { accessToken: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;
let deps: Deps = defaultDeps();

function defaultDeps(): Deps {
  return {
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    fetch: globalThis.fetch,
    env: (name) => process.env[name],
    readToken: () => readJson<TokenRecord>(TOKEN_BLOB),
    writeToken: (record) => writeJson(TOKEN_BLOB, record),
    readCatalog: () => readJson<CatalogRecord>(CATALOG_BLOB),
    writeCatalog: (record) => writeJson(CATALOG_BLOB, record),
  };
}

function localFile(blobPath: string) {
  const root = process.env.EPP_ZOHO_CACHE_PATH ?? path.join("/tmp", "epp-zoho-cache");
  return path.join(root, blobPath.replace(/\//g, "-"));
}

async function readJson<T>(blobPath: string): Promise<T> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const result = await get(blobPath, { access: "private", useCache: false, token });
    if (!result || result.statusCode !== 200 || !result.stream) return {} as T;
    return JSON.parse(await new Response(result.stream).text()) as T;
  }
  try {
    return JSON.parse(await readFile(localFile(blobPath), "utf8")) as T;
  } catch {
    return {} as T;
  }
}

async function writeJson(blobPath: string, record: unknown) {
  const body = JSON.stringify(record);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    await put(blobPath, body, {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      token,
    });
    return;
  }
  const file = localFile(blobPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export function configureZohoTokenForTests(next: Partial<Deps>) {
  memory = null;
  inflight = null;
  deps = { ...defaultDeps(), ...next };
}

export function resetZohoTokenForTests() {
  memory = null;
  inflight = null;
  deps = defaultDeps();
}

function fresh(expiresAt: number | undefined, now: number) {
  return typeof expiresAt === "number" && expiresAt - now > FRESH_MS;
}

function alive(expiresAt: number | undefined, now: number) {
  return typeof expiresAt === "number" && expiresAt > now;
}

function remember(accessToken: string, expiresAt: number) {
  memory = { accessToken, expiresAt };
  return accessToken;
}

export function getZohoAccessToken() {
  const now = deps.now();
  if (memory && fresh(memory.expiresAt, now)) return Promise.resolve(memory.accessToken);
  if (!inflight) inflight = loadToken().finally(() => { inflight = null; });
  return inflight;
}

async function loadToken() {
  const now = deps.now();
  const stored = await deps.readToken();
  if (stored.backoffUntil && stored.backoffUntil > now) {
    if (stored.accessToken && alive(stored.expiresAt, now)) return remember(stored.accessToken, stored.expiresAt!);
    throw new ZohoRateLimitError();
  }
  if (stored.accessToken && fresh(stored.expiresAt, now)) return remember(stored.accessToken, stored.expiresAt!);
  if (stored.refreshLockUntil && stored.refreshLockUntil > now && stored.refreshLockId) {
    await deps.sleep(500);
    const again = await deps.readToken();
    const later = deps.now();
    if (again.accessToken && fresh(again.expiresAt, later)) return remember(again.accessToken, again.expiresAt!);
    if (again.backoffUntil && again.backoffUntil > later) throw new ZohoRateLimitError();
  }
  const lockId = `${now}-${Math.random().toString(36).slice(2)}`;
  await deps.writeToken({ ...stored, refreshLockId: lockId, refreshLockUntil: now + LOCK_MS });
  const won = await deps.readToken();
  if (won.refreshLockId !== lockId) {
    await deps.sleep(700);
    const laterRecord = await deps.readToken();
    const later = deps.now();
    if (laterRecord.accessToken && alive(laterRecord.expiresAt, later)) {
      return remember(laterRecord.accessToken, laterRecord.expiresAt!);
    }
    throw new ZohoRateLimitError();
  }
  try {
    const minted = await mint();
    const latest = await deps.readToken();
    await deps.writeToken({
      ...latest,
      accessToken: minted.accessToken,
      expiresAt: minted.expiresAt,
      refreshLockId: undefined,
      refreshLockUntil: undefined,
      backoffUntil: undefined,
    });
    return remember(minted.accessToken, minted.expiresAt);
  } catch (err) {
    if (err instanceof ZohoRateLimitError) {
      const latest = await deps.readToken();
      await deps.writeToken({
        ...latest,
        refreshLockId: undefined,
        refreshLockUntil: undefined,
        backoffUntil: deps.now() + BACKOFF_MS,
      });
      if (latest.accessToken && alive(latest.expiresAt, deps.now())) {
        return remember(latest.accessToken, latest.expiresAt!);
      }
    }
    throw err;
  }
}

async function mint() {
  const env = (name: string) => deps.env(name)?.trim();
  const refresh = env("FUEL_ZOHO_REFRESH_TOKEN");
  const clientId = env("FUEL_ZOHO_CLIENT_ID");
  const clientSecret = env("FUEL_ZOHO_CLIENT_SECRET");
  const accounts = env("FUEL_ZOHO_ACCOUNTS_URL")?.replace(/\/$/, "");
  if (!refresh || !clientId || !clientSecret || !accounts) {
    throw new ZohoTokenError("Fuel CRM is not configured.", 503);
  }
  const response = await deps.fetch(`${accounts}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refresh,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const payload = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
  if (payload && /too many requests/i.test(JSON.stringify(payload))) throw new ZohoRateLimitError();
  if (!response.ok || !payload?.access_token) throw new ZohoTokenError("Fuel CRM credentials were not accepted.", 502);
  const expiresIn = Number(payload.expires_in);
  const seconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600;
  return { accessToken: payload.access_token, expiresAt: deps.now() + seconds * 1000 };
}

export async function rememberZohoCatalog(scope: "admin" | "judge", applications: FuelApplication[]) {
  try {
    const current = await deps.readCatalog();
    await deps.writeCatalog({ ...current, [scope]: applications, at: new Date(deps.now()).toISOString() });
  } catch {
    // A catalog miss must not turn a successful CRM read into a failure.
  }
}

export async function readZohoCatalog(scope: "admin" | "judge") {
  try {
    const current = await deps.readCatalog();
    const rows = current[scope];
    if (!Array.isArray(rows)) return null;
    return rows.filter((row) => row && typeof row.id === "string");
  } catch {
    return null;
  }
}
