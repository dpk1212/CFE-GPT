import { NextResponse } from "next/server";
import { loginResult, normalizeEmail, type Role } from "@/lib/accounts";
import { verifyPassword } from "@/lib/password";
import { sealSession, sessionCookie } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; role?: Role } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";
  const role = body?.role;
  if (!email || !password || (role !== "admin" && role !== "judge")) {
    return NextResponse.json({ error: "Enter your email, password, and role." }, { status: 400 });
  }
  const accounts = await readAccounts();
  const account = accounts.find((item) => item.email === email);
  const result = loginResult(accounts, email, account ? verifyPassword(password, account.passwordHash) : false, role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  const response = NextResponse.json({ role: result.account.role });
  response.cookies.set(sessionCookie(await sealSession({ email: result.account.email, role: result.account.role })));
  return response;
}
