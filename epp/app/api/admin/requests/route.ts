import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { reviewRequest } from "@/lib/accounts";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await openSession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { email?: string; action?: "approve" | "decline" } | null;
  if (!body?.email || (body.action !== "approve" && body.action !== "decline")) {
    return NextResponse.json({ error: "Choose a request." }, { status: 400 });
  }
  let error: string | undefined;
  await updateAccounts((accounts) => {
    const result = reviewRequest(accounts, body.email ?? "", body.action ?? "decline", new Date().toISOString());
    error = result.error;
    return result.accounts;
  });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
