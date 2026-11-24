import assert from "node:assert/strict";
import { test } from "node:test";
import { admitGoogleIdentity, bootstrapAdmin, createAdmin, loginResult, requestJudge, reviewRequest, type Account } from "./accounts.ts";

const now = "2026-11-24T13:00:00.000Z";

test("a judge request waits for approval", () => {
  const requested = requestJudge([], { name: "Avery Judge", email: "Avery@Example.com", passwordHash: "hash" }, now);
  assert.equal(requested.error, undefined);
  assert.equal(requested.accounts[0].email, "avery@example.com");
  assert.equal(requested.accounts[0].status, "pending");
  assert.equal(requested.accounts[0].role, "judge");
  const duplicate = requestJudge(requested.accounts, { name: "Avery Judge", email: "avery@example.com", passwordHash: "hash" }, now);
  assert.match(duplicate.error ?? "", /waiting/);
});

test("admin approval lets the matching role sign in", () => {
  const requested = requestJudge([], { name: "Avery Judge", email: "avery@example.com", passwordHash: "hash" }, now);
  const waiting = loginResult(requested.accounts, "avery@example.com", true, "judge");
  assert.equal(waiting.ok, false);
  const approved = reviewRequest(requested.accounts, "avery@example.com", "approve", now);
  assert.equal(loginResult(approved.accounts, "avery@example.com", true, "judge").ok, true);
  const wrongRole = loginResult(approved.accounts, "avery@example.com", true, "admin");
  assert.equal(wrongRole.ok, false);
  if (!wrongRole.ok) assert.match(wrongRole.error, /Judge/);
});

test("a declined judge can request again", () => {
  const requested = requestJudge([], { name: "Avery Judge", email: "avery@example.com", passwordHash: "old" }, now);
  const declined = reviewRequest(requested.accounts, "avery@example.com", "decline", now);
  const again = requestJudge(declined.accounts, { name: "Avery Judge", email: "avery@example.com", passwordHash: "new" }, now);
  assert.equal(again.accounts.length, 1);
  assert.equal(again.accounts[0].status, "pending");
  assert.equal(again.accounts[0].passwordHash, "new");
});

test("google sign-in matches an approved email and parks a new one", () => {
  const admin = bootstrapAdmin([], "admin-hash", now);
  const known = admitGoogleIdentity(admin, { name: "Dale Kolnitys", email: "Kolnitd@umich.edu", passwordHash: "unused" }, now);
  assert.equal(known.outcome, "approved");
  if (known.outcome === "approved") assert.equal(known.account.role, "admin");
  const created = admitGoogleIdentity(admin, { name: "New Judge", email: "new.judge@example.com", passwordHash: "random" }, now);
  assert.equal(created.outcome, "pending");
  assert.equal(created.accounts.at(-1)?.status, "pending");
  assert.equal(created.accounts.at(-1)?.role, "judge");
  const again = admitGoogleIdentity(created.accounts, { name: "New Judge", email: "new.judge@example.com", passwordHash: "other" }, now);
  assert.equal(again.outcome, "pending");
  assert.equal(again.accounts.filter((account) => account.email === "new.judge@example.com").length, 1);
});

test("only a new email can become an admin", () => {
  const accounts: Account[] = bootstrapAdmin([], "admin-hash", now);
  const created = createAdmin(accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.equal(created.accounts.at(-1)?.role, "admin");
  assert.equal(created.accounts.at(-1)?.status, "approved");
  const clash = createAdmin(created.accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.match(clash.error ?? "", /already/);
});
