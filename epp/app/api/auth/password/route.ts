import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { passwordAuditChange, setJudgePassword } from "@/lib/accounts";
import { recordFuelAdminChange } from "@/lib/fuelAdmin/store";
import { hashPassword } from "@/lib/password";
import { openSession, sealSession, sessionCookie, SESSION_COOKIE } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "judge") {
    return NextResponse.json({ error: "Sign in as a judge." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { password?: string; confirm?: string } | null;
  const password = body?.password ?? "";
  const confirm = body?.confirm ?? "";
  if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  if (password !== confirm) return NextResponse.json({ error: "Those passwords do not match." }, { status: 400 });

  let error: string | undefined;
  await updateAccounts((accounts) => {
    const result = setJudgePassword(accounts, session.email, hashPassword(password));
    if ("error" in result && result.error) error = result.error;
    return result.accounts;
  });
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    await recordFuelAdminChange(
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        email: session.email,
        applicationId: "",
        projectName: "Judge access",
        pipeline: "",
        wrote: false,
        scope: "roster",
        changes: [passwordAuditChange("password changed", session.email)],
      },
      null,
    );
  } catch {
    return NextResponse.json({ error: "The password was saved, but the audit log was not updated." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie(await sealSession({ email: session.email, role: session.role })));
  return response;
}
