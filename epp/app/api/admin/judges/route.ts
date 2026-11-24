import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addApprovedJudge, passwordAuditChange, removeJudge, resetJudgePassword } from "@/lib/accounts";
import { recordFuelAdminChange } from "@/lib/fuelAdmin/store";
import { hashPassword, temporaryPassword } from "@/lib/password";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") return null;
  return session;
}

async function recordRoster(
  email: string,
  changes: { field: string; label: string; old: string; new: string }[],
) {
  await recordFuelAdminChange(
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      email,
      applicationId: "",
      projectName: "Judge access",
      pipeline: "",
      wrote: false,
      scope: "roster",
      changes,
    },
    null,
  );
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
    action?: string;
    password?: string;
  } | null;
  const email = body?.email ?? "";

  if (body?.action === "remove") {
    let error: string | undefined;
    let removedEmail = "";
    await updateAccounts((accounts) => {
      const result = removeJudge(accounts, email);
      if ("error" in result && result.error) error = result.error;
      else if ("removed" in result && result.removed) removedEmail = result.removed.email;
      return result.accounts;
    });
    if (error || !removedEmail) return NextResponse.json({ error: error ?? "That judge is not on the list." }, { status: 400 });
    try {
      await recordRoster(session.email, [{ field: "judge", label: "Removed judge", old: removedEmail, new: "" }]);
    } catch {
      return NextResponse.json({ error: "The judge was removed, but the audit log was not updated." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "reset") {
    const password = temporaryPassword();
    let error: string | undefined;
    let savedEmail = "";
    await updateAccounts((accounts) => {
      const result = resetJudgePassword(accounts, email, hashPassword(password), new Date().toISOString());
      if ("error" in result && result.error) error = result.error;
      else if ("account" in result && result.account) savedEmail = result.account.email;
      return result.accounts;
    });
    if (error || !savedEmail) return NextResponse.json({ error: error ?? "That judge is not on the list." }, { status: 400 });
    try {
      await recordRoster(session.email, [passwordAuditChange("password reset", savedEmail)]);
    } catch {
      return NextResponse.json({ error: "The password was reset, but the audit log was not updated.", email: savedEmail, password }, { status: 500 });
    }
    return NextResponse.json({ ok: true, email: savedEmail, password });
  }

  const supplied = (body?.password ?? "").trim();
  if (supplied && supplied.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }
  const setPassword = supplied.length >= 8;
  let error: string | undefined;
  let savedEmail = "";
  await updateAccounts((accounts) => {
    const result = addApprovedJudge(
      accounts,
      {
        name: body?.name,
        email,
        passwordHash: hashPassword(setPassword ? supplied : randomBytes(32).toString("hex")),
        setPassword,
      },
      new Date().toISOString(),
    );
    if ("error" in result && result.error) error = result.error;
    else if ("account" in result && result.account) savedEmail = result.account.email;
    return result.accounts;
  });
  if (error || !savedEmail) return NextResponse.json({ error: error ?? "Enter a valid email." }, { status: 400 });
  try {
    await recordRoster(session.email, [
      { field: "judge", label: "Added judge", old: "", new: savedEmail },
      ...(setPassword ? [passwordAuditChange("password set", savedEmail)] : []),
    ]);
  } catch {
    return NextResponse.json(
      setPassword
        ? { error: "The judge was added, but the audit log was not updated.", email: savedEmail, password: supplied }
        : { error: "The judge was added, but the audit log was not updated." },
      { status: 500 },
    );
  }
  return NextResponse.json(setPassword ? { ok: true, email: savedEmail, password: supplied } : { ok: true, email: savedEmail });
}
