import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadFuelInsights } from "@/lib/fuelAdmin/insights";
import { FuelJudgeError } from "@/lib/fuelJudge/service";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  }
  try {
    return NextResponse.json(await loadFuelInsights());
  } catch (err) {
    if (err instanceof FuelJudgeError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Fuel insights could not be loaded." }, { status: 500 });
  }
}
