import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ error: "Google sign-in is handled by Clerk." }, { status: 410 });
}
