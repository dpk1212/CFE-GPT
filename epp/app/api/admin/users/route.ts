import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/accounts";
import { hashPassword } from "@/lib/password";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await openSession(token);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
  const password = body?.password ?? "";
  if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters for the password." }, { status: 400 });
  const passwordHash = hashPassword(password);
  let error: string | undefined;
  await updateAccounts((accounts) => {
    const result = createAdmin(accounts, { name: body?.name ?? "", email: body?.email ?? "", passwordHash }, new Date().toISOString());
    error = result.error;
    return result.accounts;
  });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
