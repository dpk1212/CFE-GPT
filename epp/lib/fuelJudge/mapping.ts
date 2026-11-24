import type { FuelApplication, ReviewerIdentity, ReviewInput } from "./types";

/**
 * CRM field mapping for CFE Application_Review (module API name Application_Review)
 * and Fuel applications (module API name Deals, Pipeline = Fuel).
 *
 * Written reviews already in CRM use Review_Type "Fuel initial judge review"
 * and Status "Submitted", with ratings stored as "3 = Adequate".
 * Those strings are copied here so new rows match the rows the Zoho form created.
 */

export const RATING_TEXT: Record<number, string> = {
  1: "1 = Unclear",
  2: "2 = Limited",
  3: "3 = Adequate",
  4: "4 = Strong",
  5: "5 = Exceptional",
};

export const ADVANCE_TEXT = {
  yes: "Yes, this team/project should advance",
  no: "No, this team has more work to do",
} as const;

export const FUNDING_TEXT = {
  yes: "Yes",
  no: "No, not at this time",
} as const;

const DEAL_FIELDS = [
  "id",
  "Project_Name",
  "Stage",
  "Pipeline",
  "Number_of_Application_Reviews",
  "One_Sentence_Project_Summary",
  "Project_Industries",
  "PDF_URL",
  "What_Funding_Are_You_Requesting",
  "Budget_URL",
  "Quad_Chart",
  "Technical_Evidence_URL",
  "Proof_of_Traction_URL",
  "Images_URL",
  "Supporting_URL",
  "Video_demo_etc_URL",
  "Additional_Doc_URL",
  "Modified_Time",
].join(",");

export const FUEL_DEAL_FIELDS = DEAL_FIELDS;

export function dealToApplication(
  row: Record<string, unknown>,
  initialFeedback: string[] = [],
): FuelApplication | null {
  const projectName = text(row.Project_Name);
  const id = text(row.id);
  if (!id || !projectName) return null;
  return {
    id,
    projectName,
    stage: text(row.Stage),
    pipeline: text(row.Pipeline),
    totalReviews: numberOrNull(row.Number_of_Application_Reviews),
    summary: text(row.One_Sentence_Project_Summary),
    industries: text(row.Project_Industries),
    fuelApplicationUrl: textOrNull(row.PDF_URL),
    fundingRequested: numberOrNull(row.What_Funding_Are_You_Requesting),
    budgetUrl: textOrNull(row.Budget_URL),
    quadChartUrl: textOrNull(row.Quad_Chart),
    technicalEvidenceUrl: textOrNull(row.Technical_Evidence_URL),
    tractionUrl: textOrNull(row.Proof_of_Traction_URL),
    imagesUrl: textOrNull(row.Images_URL),
    pitchDeckUrl: textOrNull(row.Supporting_URL),
    videoUrl: textOrNull(row.Video_demo_etc_URL),
    additionalUrl: textOrNull(row.Additional_Doc_URL),
    modifiedTime: textOrNull(row.Modified_Time),
    initialFeedback,
  };
}

export function feedbackFromReview(row: Record<string, unknown>): string | null {
  const strengths = text(row.Final_Feedback_or_Outstanding_Questions_for_Team);
  const improvements = text(row.Areas_for_Improvement);
  const parts = [
    strengths ? `Strengths: ${strengths}` : "",
    improvements ? `Improve: ${improvements}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

export function buildCrmRecord(
  input: ReviewInput,
  application: FuelApplication,
  reviewer: ReviewerIdentity,
): Record<string, unknown> {
  const { first, last } = splitName(reviewer.name);
  const base: Record<string, unknown> = {
    Reviewed_Project: application.projectName,
    Application1: { id: application.id },
    Reviewer_Email: reviewer.email.trim().toLowerCase(),
    Reviewer_First_Name: first,
    Reviewer_Last_Name: last,
    Status: "Submitted",
  };
  if (input.form === "written") {
    return {
      ...base,
      Name: `Fuel Initial Review_${application.projectName}`.slice(0, 120),
      Review_Type: "Fuel initial judge review",
      Conflict_of_Interest: input.conflict,
      Rating_for_Potential_for_Positive_Impact: RATING_TEXT[input.ratings.problem],
      Positive_Impact_Feedback: blank(input.feedback.problem),
      Rating_for_Value_Proposition: RATING_TEXT[input.ratings.solution],
      Value_Proposition_Feedback: blank(input.feedback.solution),
      Sustainability_and_Viability_of_the_Venture: RATING_TEXT[input.ratings.market],
      Viability_Feedback: blank(input.feedback.market),
      Rating_for_Freedom_to_Operate: RATING_TEXT[input.ratings.freedom],
      Feedback_for_Freedom_to_Operate: blank(input.feedback.freedom),
      Rating_for_Go_to_Market: RATING_TEXT[input.ratings.execution],
      Feedback_for_Go_to_Market: blank(input.feedback.execution),
      Final_Feedback_or_Outstanding_Questions_for_Team: blank(input.strengths),
      Areas_for_Improvement: blank(input.improvements),
      Should_This_Team_Advance_to_Presenting: ADVANCE_TEXT[input.advance],
      Do_you_Know_a_Good_Coach_for_This_Team: blank(input.coach),
      Internal_Notes: blank(input.internalNotes),
    };
  }
  return {
    ...base,
    Name: `Fuel Presentation Review_${application.projectName}`.slice(0, 120),
    Review_Type: "Funding Recommendation",
    Conflict_of_Interest: input.conflict || null,
    Final_Feedback_or_Outstanding_Questions_for_Team: blank(input.didWell),
    Areas_for_Improvement: blank(input.prioritize),
    Do_you_Know_a_Good_Coach_for_This_Team: blank(input.coach),
    Funding_Recommendation: FUNDING_TEXT[input.funding],
    Internal_Notes: blank(input.internalNotes),
  };
}

export function validateReview(input: ReviewInput): string | null {
  if (!input.applicationId) return "Choose an application.";
  if (input.confidentiality !== true) {
    return "The confidentiality agreement is required.";
  }
  if (input.form === "written") {
    if (input.conflict !== "Yes" && input.conflict !== "No") {
      return "Conflict of interest is required.";
    }
    for (const key of ["problem", "solution", "market", "freedom", "execution"] as const) {
      const value = input.ratings[key];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return "Each rubric category needs a rating from 1 to 5.";
      }
    }
    if (input.advance !== "yes" && input.advance !== "no") {
      return "Choose whether this team should advance.";
    }
    return null;
  }
  if (input.funding !== "yes" && input.funding !== "no") {
    return "Choose whether this team should receive Fuel funding.";
  }
  return null;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function textOrNull(value: unknown) {
  const next = text(value);
  return next || null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function blank(value: string | undefined) {
  const next = (value || "").trim();
  return next || null;
}
