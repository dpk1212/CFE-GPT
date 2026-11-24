import assert from "node:assert/strict";
import test from "node:test";
import { collectCoqlPages, postCoqlAll, type CoqlPageResult } from "./zohoCoql";

test("COQL paging follows more_records and drops a repeated deal id", async () => {
  const queries: string[] = [];
  const pages: CoqlPageResult[] = [
    { ok: true, more: true, message: "", rows: [{ id: "a" }, { id: "b" }] },
    { ok: true, more: false, message: "", rows: [{ id: "b" }, { id: "c" }] },
  ];
  const collected = await collectCoqlPages(async (query) => {
    queries.push(query);
    const next = pages.shift();
    if (!next) throw new Error("unexpected page");
    return next;
  }, "select id from Deals where Pipeline = 'Fuel'");
  assert.equal(collected.ok, true);
  if (!collected.ok) return;
  assert.deepEqual(collected.rows.map((row) => row.id), ["a", "b", "c"]);
  assert.equal(collected.truncated, false);
  assert.match(queries[0], /order by id asc limit 200$/);
  assert.match(queries[1], /limit 200 offset 200$/);
  assert.equal(queries.length, 2);
});

test("an ordered COQL failure falls back to one unordered page", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { select_query: string };
    if (body.select_query.includes("order by")) {
      return new Response(JSON.stringify({ message: "order by is not supported" }), { status: 400 });
    }
    return new Response(JSON.stringify({ data: [{ id: "a" }], info: { more_records: true } }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await postCoqlAll("token", "https://example.test", "select id from Deals where Pipeline = 'Fuel'");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.rows.map((row) => row.id), ["a"]);
    assert.equal(result.truncated, true);
  } finally {
    globalThis.fetch = original;
  }
});

test("a failed later page is not treated as the full set", async () => {
  const collected = await collectCoqlPages(async () => {
    return { ok: false, rows: [], more: false, message: "Fuel CRM could not be read." };
  }, "select id from Deals where Pipeline = 'Fuel'");
  assert.deepEqual(collected, { ok: false, message: "Fuel CRM could not be read." });
});
