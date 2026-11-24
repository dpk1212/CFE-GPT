import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_FUEL_CONFIG } from "@/lib/fuelJudge/defaults";
import { handleFuelJudge } from "@/lib/fuelJudge/http";
import { loadFuelJudgeState } from "@/lib/fuelJudge/store";
import type { FuelJudgeConfig } from "@/lib/fuelJudge/types";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  }
  const state = await loadFuelJudgeState();
  return NextResponse.json({
    config: state.config ?? DEFAULT_FUEL_CONFIG,
  });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as FuelJudgeConfig | null;
  if (!body) {
    return NextResponse.json({ error: "Send a stage configuration." }, { status: 400 });
  }
  const result = await handleFuelJudge({
    method: "PUT",
    action: "config",
    body,
    reviewer: null,
    role: session.role,
    authOpen: false,
  });
  return NextResponse.json(result.body, { status: result.status });
}
