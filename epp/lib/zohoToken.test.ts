import assert from "node:assert/strict";
import { test } from "node:test";
import type { FuelApplication } from "./fuelJudge/types.ts";
import {
  ZohoRateLimitError,
  configureZohoTokenForTests,
  getZohoAccessToken,
  readZohoCatalog,
  rememberZohoCatalog,
  resetZohoTokenForTests,
} from "./zohoToken.ts";

const env = {
  FUEL_ZOHO_REFRESH_TOKEN: "refresh",
  FUEL_ZOHO_CLIENT_ID: "id",
  FUEL_ZOHO_CLIENT_SECRET: "secret",
  FUEL_ZOHO_ACCOUNTS_URL: "https://accounts.example.test",
};

function harness() {
  let now = 1_000_000;
  let token: Record<string, unknown> = {};
  let catalog: Record<string, unknown> = {};
  const calls: string[] = [];
  let payload: unknown = { access_token: "token-1", expires_in: 3600 };
  configureZohoTokenForTests({
    now: () => now,
    sleep: async () => {},
    env: (name) => env[name as keyof typeof env],
    readToken: async () => ({ ...token }),
    writeToken: async (record) => { token = { ...record }; },
    readCatalog: async () => catalog as { admin?: FuelApplication[]; judge?: FuelApplication[] },
    writeCatalog: async (record) => { catalog = { ...record }; },
    fetch: async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  return {
    calls,
    setNow: (value: number) => { now = value; },
    setPayload: (value: unknown) => { payload = value; },
    token: () => token,
  };
}

test("one refresh is reused until five minutes before expiry", async () => {
  const box = harness();
  assert.equal(await getZohoAccessToken(), "token-1");
  assert.equal(await getZohoAccessToken(), "token-1");
  box.setNow(1_000_000 + 50 * 60 * 1000);
  assert.equal(await getZohoAccessToken(), "token-1");
  assert.equal(box.calls.length, 1);
  assert.match(box.calls[0], /\/oauth\/v2\/token$/);
});

test("a shared cache serves the token without another refresh", async () => {
  const box = harness();
  await getZohoAccessToken();
  configureZohoTokenForTests({
    now: () => 1_000_000 + 1000,
    sleep: async () => {},
    env: (name) => env[name as keyof typeof env],
    readToken: async () => box.token(),
    writeToken: async () => {},
    readCatalog: async () => ({}),
    writeCatalog: async () => {},
    fetch: async () => { throw new Error("should not refresh"); },
  });
  assert.equal(await getZohoAccessToken(), "token-1");
});

test("concurrent callers share one refresh", async () => {
  const box = harness();
  const store: Record<string, unknown> = {};
  let release: (value: Response) => void = () => {};
  configureZohoTokenForTests({
    now: () => 1_000_000,
    sleep: async () => {},
    env: (name) => env[name as keyof typeof env],
    readToken: async () => ({ ...store }),
    writeToken: async (record) => { Object.assign(store, record); },
    readCatalog: async () => ({}),
    writeCatalog: async () => {},
    fetch: () => new Promise((resolve) => { box.calls.push("token"); release = resolve; }),
  });
  const first = getZohoAccessToken();
  const second = getZohoAccessToken();
  for (let i = 0; i < 20 && box.calls.length === 0; i += 1) await Promise.resolve();
  release(new Response(JSON.stringify({ access_token: "token-1", expires_in: 3600 }), { status: 200 }));
  assert.equal(await first, "token-1");
  assert.equal(await second, "token-1");
  assert.equal(box.calls.length, 1);
});

test("too many requests backs off and keeps the last catalog", async () => {
  const box = harness();
  await getZohoAccessToken();
  await rememberZohoCatalog("admin", [{ id: "deal-1" } as FuelApplication]);
  box.setNow(1_000_000 + 3600 * 1000);
  box.setPayload({ error: "Access Denied", error_description: "You have made too many requests continuously." });
  await assert.rejects(getZohoAccessToken(), ZohoRateLimitError);
  box.setPayload({ access_token: "token-2", expires_in: 3600 });
  await assert.rejects(getZohoAccessToken(), ZohoRateLimitError);
  assert.equal(box.calls.length, 2);
  const cached = await readZohoCatalog("admin");
  assert.equal(cached?.[0]?.id, "deal-1");
  resetZohoTokenForTests();
});
