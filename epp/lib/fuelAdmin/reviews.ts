import type { FuelAuditEntry } from "./store";
import type { FuelApplication } from "../fuelJudge/types";

export type DeskPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  applications: FuelApplication[];
  audit: FuelAuditEntry[];
  reviews?: FuelDeskReview[];
  truncated?: boolean;
  syncing?: boolean;
};

export type FuelDeskReview = {
  id: string;
  applicationId: string;
  projectName: string;
  reviewer: string;
  kind: string;
  scores: { label: string; value: number; comment: string }[];
  notes: { label: string; text: string }[];
  average: number | null;
  dryRun: boolean;
  source: "desk" | "crm";
};

const SCORE_FIELDS: { key: string; comment: string; label: string }[] = [
  { key: "Rating_for_Potential_for_Positive_Impact", comment: "Positive_Impact_Feedback", label: "Problem" },
  { key: "Rating_for_Value_Proposition", comment: "Value_Proposition_Feedback", label: "Solution" },
  { key: "Sustainability_and_Viability_of_the_Venture", comment: "Viability_Feedback", label: "Market" },
  { key: "Rating_for_Freedom_to_Operate", comment: "Feedback_for_Freedom_to_Operate", label: "Freedom to operate" },
  { key: "Rating_for_Go_to_Market", comment: "Feedback_for_Go_to_Market", label: "Go to market" },
];

/** One sample score sheet so the mock desk can show the review layout. Live mode does not add it. */
export const SAMPLE_DESK_REVIEW: FuelDeskReview = {
  id: "sample-review-glass",
  applicationId: "sample-glass",
  projectName: "Glass Orchard",
  reviewer: "Sample judge",
  kind: "Fuel initial judge review",
  scores: [
    { label: "Problem", value: 4, comment: "Growers can name the film they want swapped." },
    { label: "Solution", value: 4, comment: "" },
    { label: "Market", value: 3, comment: "The price still needs a buyer." },
    { label: "Freedom to operate", value: 4, comment: "" },
    { label: "Go to market", value: 4, comment: "" },
  ],
  notes: [
    { label: "Strengths", text: "Growers already asked to pilot two films." },
    { label: "Improve", text: "The price needs a buyer, not just a grower." },
    { label: "Advance", text: "Yes, this team/project should advance" },
  ],
  average: 3.8,
  dryRun: true,
  source: "desk",
};

export function parseStoredReview(record: Record<string, unknown>, index: number): FuelDeskReview | null {
  const applicationId = lookupId(record.Application1);
  if (!applicationId) return null;
  const scores = SCORE_FIELDS.flatMap((field) => {
    const value = score(record[field.key]);
    if (value == null) return [];
    return [{ label: field.label, value, comment: text(record[field.comment]) }];
  });
  const notes: { label: string; text: string }[] = [
    ["Strengths", record.Final_Feedback_or_Outstanding_Questions_for_Team],
    ["Improve", record.Areas_for_Improvement],
    ["Advance", record.Should_This_Team_Advance_to_Presenting],
    ["Funding", record.Funding_Recommendation],
    ["Coach", record.Do_you_Know_a_Good_Coach_for_This_Team],
    ["Internal notes", record.Internal_Notes],
  ].flatMap(([label, value]) => {
    const note = text(value);
    return note ? [{ label: String(label), text: note }] : [];
  });
  const reviewer = [text(record.Reviewer_First_Name), text(record.Reviewer_Last_Name)].filter(Boolean).join(" ");
  const average = scores.length
    ? Math.round((scores.reduce((sum, item) => sum + item.value, 0) / scores.length) * 10) / 10
    : null;
  return {
    id: `stored-${index}-${applicationId}`,
    applicationId,
    projectName: text(record.Reviewed_Project),
    reviewer: reviewer || text(record.Reviewer_Email) || "Judge",
    kind: text(record.Review_Type) || "Review",
    scores,
    notes,
    average,
    dryRun: true,
    source: "desk",
  };
}

function lookupId(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return text((value as { id?: unknown }).id);
  }
  return text(value);
}

function score(value: unknown) {
  const raw = text(value);
  const match = /^([1-5])\b/.exec(raw);
  return match ? Number(match[1]) : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
