import assert from "node:assert/strict";
import { test } from "node:test";
import { addApprovedJudge, admitGoogleIdentity, bootstrapAdmin, createAdmin, DALE_GOOGLE_ADMIN_EMAIL, loginResult, removeJudge, requestJudge, reviewRequest, type Account } from "./accounts.ts";

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

test("Dale's Google account is an admin even if a pending judge row exists", () => {
  const pending = requestJudge([], { name: "Dale Kolnitys", email: DALE_GOOGLE_ADMIN_EMAIL, passwordHash: "old" }, now);
  const admitted = admitGoogleIdentity(pending.accounts, { name: "Dale Kolnitys", email: "Kolnitd12@gmail.com", passwordHash: "unused" }, now);
  assert.equal(admitted.outcome, "approved");
  if (admitted.outcome === "approved") {
    assert.equal(admitted.account.role, "admin");
    assert.equal(admitted.account.email, DALE_GOOGLE_ADMIN_EMAIL);
  }
  assert.equal(admitted.accounts.filter((account) => account.email === DALE_GOOGLE_ADMIN_EMAIL).length, 1);
});

test("an admin can pre-approve a judge email and that sign-in skips the request", () => {
  const added = addApprovedJudge([], { email: "Avery@Example.edu" }, now);
  assert.equal(added.error, undefined);
  if ("error" in added && added.error) return;
  assert.equal(added.account.email, "avery@example.edu");
  assert.equal(added.account.status, "approved");
  assert.equal(added.account.role, "judge");
  assert.equal(added.account.name.length >= 2, true);
  const signedIn = admitGoogleIdentity(added.accounts, { name: "Avery Judge", email: "avery@example.edu", passwordHash: "clerk" }, now);
  assert.equal(signedIn.outcome, "approved");
  if (signedIn.outcome === "approved") assert.equal(signedIn.account.role, "judge");
  assert.equal(signedIn.accounts.filter((account) => account.status === "pending").length, 0);
  const duplicate = addApprovedJudge(added.accounts, { email: "avery@example.edu" }, now);
  assert.match(duplicate.error ?? "", /already approved/);
  const admin = addApprovedJudge(bootstrapAdmin([], "hash", now), { email: "Kolnitd@umich.edu" }, now);
  assert.match(admin.error ?? "", /admin/);
});

test("pre-approving a waiting request keeps the existing approval path working", () => {
  const requested = requestJudge([], { name: "Avery Judge", email: "avery@example.com", passwordHash: "chosen" }, now);
  const promoted = addApprovedJudge(requested.accounts, { email: "AVERY@example.com" }, now);
  assert.equal(promoted.error, undefined);
  if ("account" in promoted) {
    assert.equal(promoted.account.status, "approved");
    assert.equal(promoted.account.passwordHash, "chosen");
    assert.equal(promoted.account.name, "Avery Judge");
  }
  const stillWaiting = requestJudge([], { name: "Blair Judge", email: "blair@example.com", passwordHash: "hash" }, now);
  const approved = reviewRequest(stillWaiting.accounts, "blair@example.com", "approve", now);
  assert.equal(approved.accounts[0]?.status, "approved");
  const removed = removeJudge(promoted.accounts, "avery@example.com");
  assert.equal(removed.error, undefined);
  const afterSignIn = admitGoogleIdentity(removed.accounts, { name: "Avery Judge", email: "avery@example.com", passwordHash: "clerk" }, now);
  assert.equal(afterSignIn.outcome, "pending");
  const keptAdmin = removeJudge(bootstrapAdmin([], "hash", now), "kolnitd@umich.edu");
  assert.match(keptAdmin.error ?? "", /not on the list/);
});

test("only a new email can become an admin", () => {
  const accounts: Account[] = bootstrapAdmin([], "admin-hash", now);
  const created = createAdmin(accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.equal(created.accounts.at(-1)?.role, "admin");
  assert.equal(created.accounts.at(-1)?.status, "approved");
  const clash = createAdmin(created.accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.match(clash.error ?? "", /already/);
});
