import assert from "node:assert/strict";
import { test } from "node:test";
import { openSession, sealSession } from "./session.ts";

test("a session round-trips and rejects tampering", async () => {
  const token = await sealSession({ email: "kolnitd@umich.edu", role: "admin" });
  const opened = await openSession(token);
  assert.equal(opened?.email, "kolnitd@umich.edu");
  assert.equal(opened?.role, "admin");
  assert.equal(await openSession(`${token}x`), null);
  assert.equal(await openSession("not-a-session"), null);
});
