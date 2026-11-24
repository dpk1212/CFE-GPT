import { loadFuelJudgeState } from "@/lib/fuelJudge/store";
import { fuelCrmMode } from "@/lib/fuelJudge/service";
import { getZohoAccessToken, readZohoCatalog, ZohoRateLimitError } from "@/lib/zohoToken";
import { postCoqlAll } from "@/lib/zohoCoql";
import { listFuelPipeline } from "./service";
import { buildInsights } from "./metrics";
import { parseStoredReview, SAMPLE_DESK_REVIEW, type FuelDeskReview } from "./reviews";

const REVIEW_FIELDS = [
  "Application1",
  "Review_Type",
  "Reviewer_Email",
  "Reviewer_First_Name",
  "Reviewer_Last_Name",
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
  "Final_Feedback_or_Outstanding_Questions_for_Team",
  "Areas_for_Improvement",
  "Should_This_Team_Advance_to_Presenting",
  "Funding_Recommendation",
  "Do_you_Know_a_Good_Coach_for_This_Team",
].join(",");

/** Read-only aggregates for the admin design. Does not write to Zoho. */
export async function loadFuelInsights() {
  const listed = await listFuelPipeline();
  let applications = listed.applications;
  if (listed.mode === "live") {
    const cached = await readZohoCatalog("judge");
    const notes = new Map((cached ?? []).map((row) => [row.id, row.initialFeedback]));
    applications = applications.map((application) => ({
      ...application,
      initialFeedback: application.initialFeedback.length ? application.initialFeedback : notes.get(application.id) || [],
    }));
  }
  const stored = await storedReviews();
  const crm = listed.syncing || listed.mode !== "live" ? { reviews: [] as FuelDeskReview[], warning: "" } : await crmReviews();
  return {
    mode: listed.mode,
    syncing: Boolean(listed.syncing),
    truncated: Boolean(listed.truncated),
    omitted: listed.omitted ?? 0,
    feedbackWarning: crm.warning,
    ...buildInsights(applications, [...stored, ...crm.reviews]),
  };
}

async function storedReviews() {
  try {
    const state = await loadFuelJudgeState();
    const parsed = state.submissions
      .map((row, index) => parseStoredReview(row, index))
      .filter((row): row is FuelDeskReview => Boolean(row));
    if (fuelCrmMode() === "live") return parsed;
    return [...parsed, SAMPLE_DESK_REVIEW];
  } catch {
    return fuelCrmMode() === "live" ? [] : [SAMPLE_DESK_REVIEW];
  }
}

async function crmReviews() {
  try {
    const token = await getZohoAccessToken();
    const domain = process.env.FUEL_ZOHO_API_DOMAIN?.trim().replace(/\/$/, "");
    if (!domain) return { reviews: [] as FuelDeskReview[], warning: "Fuel CRM is not configured." };
    const collected = await postCoqlAll(
      token,
      domain,
      `select ${REVIEW_FIELDS} from Application_Review where Review_Type in ('Fuel initial judge review','Funding Recommendation')`,
    );
    if (!collected.ok) return { reviews: [] as FuelDeskReview[], warning: collected.message };
    const reviews = collected.rows
      .map((row, index) => parseStoredReview(row, index))
      .filter((row): row is FuelDeskReview => Boolean(row))
      .map((review) => ({ ...review, dryRun: false, source: "crm" as const }));
    return { reviews, warning: collected.truncated ? "Judge feedback was truncated at 2,000 reviews." : "" };
  } catch (err) {
    if (err instanceof ZohoRateLimitError) return { reviews: [] as FuelDeskReview[], warning: "CRM syncing." };
    return { reviews: [] as FuelDeskReview[], warning: "Judge feedback text could not be read." };
  }
}
