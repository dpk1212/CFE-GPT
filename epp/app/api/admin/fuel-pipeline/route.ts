import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listFuelPipeline, updateFuelApplication } from "@/lib/fuelAdmin/service";
import { FuelJudgeError } from "@/lib/fuelJudge/service";
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
  try {
    return NextResponse.json(await listFuelPipeline());
  } catch (err) {
    if (err instanceof FuelJudgeError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "The Fuel pipeline could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { applicationId?: string; fields?: unknown } | null;
  if (!body?.applicationId) return NextResponse.json({ error: "Choose an application." }, { status: 400 });
  try {
    const result = await updateFuelApplication(body.applicationId, body.fields, { email: session.email });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FuelJudgeError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "The application was not updated." }, { status: 500 });
  }
}
