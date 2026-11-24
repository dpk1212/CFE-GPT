import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleFuelJudge } from "@/lib/fuelJudge/http";
import type { ReviewInput } from "@/lib/fuelJudge/types";
import { readAccounts } from "@/lib/store";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "judge" && session.role !== "admin")) {
    return NextResponse.json({ error: "Sign in to submit a review." }, { status: 401 });
  }
  const account = (await readAccounts()).find((item) => item.email === session.email);
  if (!account) {
    return NextResponse.json({ error: "Sign in to submit a review." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as ReviewInput | null;
  const result = await handleFuelJudge({
    method: "POST",
    action: "reviews",
    body,
    reviewer: { email: account.email, name: account.name },
    role: session.role,
    authOpen: false,
  });
  return NextResponse.json(result.body, { status: result.status });
}
