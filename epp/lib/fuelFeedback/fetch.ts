import { SAMPLE_APPLICATIONS } from "@/lib/fuelJudge/catalog";
import { dealToApplication, FUEL_DEAL_FIELDS } from "@/lib/fuelJudge/mapping";
import { fuelCrmMode } from "@/lib/fuelJudge/service";
import { getZohoAccessToken, ZohoRateLimitError } from "@/lib/zohoToken";
import { postCoqlAll } from "@/lib/zohoCoql";
import { buildFeedbackDocument, sampleFeedbackReviews } from "./document";
import type { FeedbackDocument } from "./types";

const REVIEW_FIELDS = [
  "id",
  "Created_Time",
  "Modified_Time",
  "Application1",
  "Review_Type",
  "Status",
  "Conflict_of_Interest",
  "Rating_for_Potential_for_Positive_Impact",
  "Positive_Impact_Feedback",
  "Rating_for_Value_Proposition",
  "Value_Proposition_Feedback",
  "Sustainability_and_Viability_of_the_Venture",
  "Viability_Feedback",
  "Rating_for_Freedom_to_Operate",
  "Feedback_for_Freedom_to_Operate",
  "Rating_for_Go_to_Market",
  "Feedback_for_Go_to_Market",
  "Rating_for_Team_Capability",
  "Feedback_for_Team_Capability",
  "Rating_for_Action_Plan_Progressive_Dev_Financial",
  "Feedback_for_Action_Plan_Progress_Dev_Financial",
  "Initial_Feedback",
  "Final_Feedback_or_Outstanding_Questions_for_Team",
  "Areas_for_Improvement",
].join(",");

export async function loadFeedbackDocument(applicationId: string): Promise<FeedbackDocument> {
  const id = applicationId.trim();
  if (!id) throw new FeedbackError("Choose an application.", 400);

  if (fuelCrmMode() !== "live") {
    const sample = SAMPLE_APPLICATIONS.find((row) => row.id === id) || SAMPLE_APPLICATIONS[0];
    const targetId = sample?.id || id;
    return buildFeedbackDocument({
      applicationId: targetId,
      projectName: sample?.projectName || "Sample project",
      summary: sample?.summary || "",
      mode: "mock",
      reviews: sampleFeedbackReviews(targetId),
    });
  }

  try {
    const token = await getZohoAccessToken();
    const domain = process.env.FUEL_ZOHO_API_DOMAIN?.trim().replace(/\/$/, "");
    if (!domain) throw new FeedbackError("Fuel CRM is not configured.", 503);

    const deal = await loadDeal(token, domain, id);
    if (!deal) throw new FeedbackError("That application was not found in Fuel CRM.", 404);

    const safeId = id.replace(/'/g, "");
    const collected = await postCoqlAll(
      token,
      domain,
      `select ${REVIEW_FIELDS} from Application_Review where Application1 in ('${safeId}')`,
    );
    if (!collected.ok) throw new FeedbackError(collected.message || "Judge feedback could not be read.", 502);

    return buildFeedbackDocument({
      applicationId: deal.id,
      projectName: deal.projectName,
      summary: deal.summary,
      mode: "live",
      reviews: collected.rows,
      warning: collected.truncated ? "Review list was truncated at the CRM page limit." : undefined,
    });
  } catch (err) {
    if (err instanceof FeedbackError) throw err;
    if (err instanceof ZohoRateLimitError) throw new FeedbackError("CRM is syncing. Try again in a moment.", 503);
    throw new FeedbackError(err instanceof Error ? err.message : "Judge feedback could not be read.", 502);
  }
}

async function loadDeal(token: string, domain: string, id: string) {
  const safeId = id.replace(/'/g, "");
  const collected = await postCoqlAll(
    token,
    domain,
    `select ${FUEL_DEAL_FIELDS} from Deals where id = '${safeId}'`,
  );
  if (!collected.ok) throw new FeedbackError(collected.message || "Fuel CRM could not be read.", 502);
  const row = collected.rows[0];
  if (!row) return null;
  return dealToApplication(row);
}

export class FeedbackError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
