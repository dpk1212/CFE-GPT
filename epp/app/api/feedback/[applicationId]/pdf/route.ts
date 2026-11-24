import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FeedbackError, loadFeedbackDocument } from "@/lib/fuelFeedback/fetch";
import { feedbackPdfFilename, renderFeedbackPdf } from "@/lib/fuelFeedback/renderPdf";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "admin" && session.role !== "judge")) {
    return NextResponse.json({ error: "Sign in to download judge feedback." }, { status: 401 });
  }
  const { applicationId } = await context.params;
  try {
    const document = await loadFeedbackDocument(decodeURIComponent(applicationId));
    const buffer = await renderFeedbackPdf(document);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${feedbackPdfFilename(document.projectName)}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof FeedbackError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "The feedback PDF could not be generated." }, { status: 502 });
  }
}
