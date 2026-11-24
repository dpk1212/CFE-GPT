import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FeedbackError, loadFeedbackDocument } from "@/lib/fuelFeedback/fetch";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "admin" && session.role !== "judge")) {
    return NextResponse.json({ error: "Sign in to open judge feedback." }, { status: 401 });
  }
  const { applicationId } = await context.params;
  try {
    const document = await loadFeedbackDocument(decodeURIComponent(applicationId));
    return NextResponse.json(document);
  } catch (err) {
    if (err instanceof FeedbackError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Judge feedback could not be loaded." }, { status: 502 });
  }
}
