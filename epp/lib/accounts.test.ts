import assert from "node:assert/strict";
import { test } from "node:test";
import { addApprovedJudge, admitGoogleIdentity, bootstrapAdmin, createAdmin, DALE_GOOGLE_ADMIN_EMAIL, loginDestination, loginResult, passwordAuditChange, passwordStatusLabel, removeJudge, requestJudge, resetJudgePassword, reviewRequest, setJudgePassword, type Account } from "./accounts.ts";
import { hashPassword, temporaryPassword, verifyPassword } from "./password.ts";

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
  const added = addApprovedJudge([], { email: "Avery@Example.edu", passwordHash: "unused" }, now);
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
  const duplicate = addApprovedJudge(added.accounts, { email: "avery@example.edu", passwordHash: "unused" }, now);
  assert.match(duplicate.error ?? "", /already approved/);
  const admin = addApprovedJudge(bootstrapAdmin([], "hash", now), { email: "Kolnitd@umich.edu", passwordHash: "unused" }, now);
  assert.match(admin.error ?? "", /admin/);
});

test("pre-approving a waiting request keeps the existing approval path working", () => {
  const requested = requestJudge([], { name: "Avery Judge", email: "avery@example.com", passwordHash: "chosen" }, now);
  const promoted = addApprovedJudge(requested.accounts, { email: "AVERY@example.com", passwordHash: "unused" }, now);
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

test("a generated temporary password can be checked and stays out of the audit record", () => {
  const password = temporaryPassword();
  assert.equal(password.length >= 16, true);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%&*]/);
  const hash = hashPassword(password);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword(`${password}x`, hash), false);
  const audit = passwordAuditChange("password set", "judge@example.edu");
  assert.equal(JSON.stringify(audit).includes(password), false);
});

test("an admin temporary password must be replaced before the desk, then a later change sticks", () => {
  const secret = "temp-pass-1";
  const added = addApprovedJudge([], { email: "judge@example.edu", passwordHash: secret, setPassword: true }, now);
  assert.equal(added.error, undefined);
  if (!("account" in added)) return;
  assert.equal(added.account.mustChangePassword, true);
  assert.equal(added.account.passwordChosen, true);
  assert.equal(passwordStatusLabel(added.account), "Temporary password");
  assert.equal(loginDestination(added.account), "/login/password/update");
  assert.equal(loginResult(added.accounts, "judge@example.edu", true, "judge").ok, true);
  const google = admitGoogleIdentity(added.accounts, { name: "Judge Example", email: "judge@example.edu", passwordHash: "clerk" }, now);
  assert.equal(google.outcome, "approved");
  if (google.outcome === "approved") {
    assert.equal(google.account.passwordHash, secret);
    assert.equal(google.account.mustChangePassword, true);
    assert.equal(google.account.role, "judge");
  }
  const chosen = setJudgePassword(added.accounts, "judge@example.edu", "own-pass");
  assert.equal(chosen.error, undefined);
  if ("account" in chosen) {
    assert.equal(chosen.account.mustChangePassword, false);
    assert.equal(chosen.account.passwordHash, "own-pass");
    assert.equal(passwordStatusLabel(chosen.account), "Password set");
    assert.equal(loginDestination(chosen.account), "/judge");
  }
  const reset = resetJudgePassword(chosen.accounts, "judge@example.edu", "reset-pass", now);
  assert.equal(reset.error, undefined);
  if ("account" in reset) {
    assert.equal(reset.account.passwordHash, "reset-pass");
    assert.equal(reset.account.mustChangePassword, true);
    assert.equal(passwordStatusLabel(reset.account), "Temporary password");
  }
  const audit = passwordAuditChange("password reset", "judge@example.edu");
  assert.equal(JSON.stringify(audit).includes(secret), false);
  assert.equal(audit.new, "judge@example.edu");
  assert.equal(audit.label, "password reset");
  const blank = addApprovedJudge([], { email: "google-only@example.edu", passwordHash: "random" }, now);
  if ("account" in blank && blank.account) assert.equal(passwordStatusLabel(blank.account), "Google only");
  const waiting = requestJudge([], { name: "Blair Judge", email: "blair@example.com", passwordHash: "chosen" }, now);
  const promoted = addApprovedJudge(waiting.accounts, { email: "blair@example.com", passwordHash: "unused" }, now);
  if ("account" in promoted && promoted.account) {
    assert.equal(promoted.account.passwordHash, "chosen");
    assert.equal(promoted.account.mustChangePassword, false);
    assert.equal(passwordStatusLabel(promoted.account), "Password set");
  }
  const replaced = addApprovedJudge(waiting.accounts, { email: "blair@example.com", passwordHash: "temp", setPassword: true }, now);
  if ("account" in replaced && replaced.account) {
    assert.equal(replaced.account.passwordHash, "temp");
    assert.equal(replaced.account.mustChangePassword, true);
  }
  const unknown = admitGoogleIdentity([], { name: "New Person", email: "new.person@example.edu", passwordHash: "random" }, now);
  const created = unknown.accounts.find((account) => account.email === "new.person@example.edu");
  assert.ok(created);
  assert.equal(created.passwordChosen, false);
  assert.equal(passwordStatusLabel(created), "Google only");
  const adminReset = resetJudgePassword(bootstrapAdmin([], "hash", now), "kolnitd@umich.edu", "nope", now);
  assert.match(adminReset.error ?? "", /not on the list/);
});

test("only a new email can become an admin", () => {
  const accounts: Account[] = bootstrapAdmin([], "admin-hash", now);
  const created = createAdmin(accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.equal(created.accounts.at(-1)?.role, "admin");
  assert.equal(created.accounts.at(-1)?.status, "approved");
  const clash = createAdmin(created.accounts, { name: "Second Admin", email: "second@example.com", passwordHash: "hash" }, now);
  assert.match(clash.error ?? "", /already/);
});
