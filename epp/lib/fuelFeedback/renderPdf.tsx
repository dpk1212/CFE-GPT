import { renderToBuffer } from "@react-pdf/renderer";
import { FeedbackPdfDocument } from "./pdf";
import { ensurePdfFonts } from "./registerPdfFonts";
import type { FeedbackDocument } from "./types";

export async function renderFeedbackPdf(doc: FeedbackDocument) {
  ensurePdfFonts();
  // JSX keeps DocumentProps typing happy for @react-pdf/renderer.
  return renderToBuffer(<FeedbackPdfDocument doc={doc} />);
}

export function feedbackPdfFilename(projectName: string) {
  const safe = projectName.replace(/[^\w\-]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "application";
  return `Fuel_Judge_Feedback_${safe}.pdf`;
}
