import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleFuelJudge } from "@/lib/fuelJudge/http";
import { readAccounts } from "@/lib/store";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "judge" && session.role !== "admin")) {
    return NextResponse.json({ error: "Sign in to open the Fuel desk." }, { status: 401 });
  }
  const account = (await readAccounts()).find((item) => item.email === session.email);
  const result = await handleFuelJudge({
    method: "GET",
    action: "dashboard",
    body: null,
    reviewer: account ? { email: account.email, name: account.name } : { email: session.email, name: "" },
    role: session.role,
    authOpen: false,
  });
  return NextResponse.json(result.body, { status: result.status });
}
