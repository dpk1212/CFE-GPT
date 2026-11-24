import { RATING_TEXT } from "@/lib/fuelJudge/mapping";
import {
  INITIAL_REVIEW_TYPE,
  PITCH_REVIEW_TYPE,
  type FeedbackComment,
  type FeedbackDocument,
  type FeedbackQuestion,
  type FeedbackRound,
  type FeedbackScoreChip,
} from "./types";

export const RUBRIC_QUESTIONS = [
  {
    id: "problem",
    title: "Problem Validation & Customer Discovery",
    score: "Rating_for_Potential_for_Positive_Impact",
    comment: "Positive_Impact_Feedback",
  },
  {
    id: "solution",
    title: "Solution & Value Proposition",
    score: "Rating_for_Value_Proposition",
    comment: "Value_Proposition_Feedback",
  },
  {
    id: "market",
    title: "Market Entry & Business Model",
    score: "Sustainability_and_Viability_of_the_Venture",
    comment: "Viability_Feedback",
  },
  {
    id: "freedom",
    title: "Freedom to Operate",
    score: "Rating_for_Freedom_to_Operate",
    comment: "Feedback_for_Freedom_to_Operate",
  },
  {
    id: "execution",
    title: "Execution Plan & Budget Fit",
    score: "Rating_for_Go_to_Market",
    comment: "Feedback_for_Go_to_Market",
  },
] as const;

/** Older (pre–fall 2026) rubric extras — only shown when a review carries them. */
export const LEGACY_QUESTIONS = [
  {
    id: "team",
    title: "Team Capability",
    score: "Rating_for_Team_Capability",
    comment: "Feedback_for_Team_Capability",
  },
  {
    id: "action",
    title: "Action Plan & Progressive Development",
    score: "Rating_for_Action_Plan_Progressive_Dev_Financial",
    comment: "Feedback_for_Action_Plan_Progress_Dev_Financial",
  },
] as const;

const SHORT_RATING: Record<number, string> = {
  1: "Unclear",
  2: "Limited",
  3: "Adequate",
  4: "Strong",
  5: "Exceptional",
};

type RawReview = Record<string, unknown>;

type IndexedReview = {
  id: string;
  judge: string;
  reviewType: string;
  createdAt: string;
  row: RawReview;
};

export function buildFeedbackDocument(input: {
  applicationId: string;
  projectName: string;
  summary?: string;
  mode: "live" | "mock";
  reviews: RawReview[];
  warning?: string;
}): FeedbackDocument {
  const eligible = input.reviews
    .filter((row) => !isConflict(row) && !isDeleted(row) && lookupId(row.Application1) === input.applicationId)
    .map((row, index) => ({ row, index, createdAt: createdTime(row) }))
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt.localeCompare(b.createdAt);
      return a.index - b.index;
    });

  const omittedConflict = input.reviews.filter((row) => lookupId(row.Application1) === input.applicationId && isConflict(row)).length;

  const indexed: IndexedReview[] = eligible.map((item, order) => ({
    id: text(item.row.id) || `review-${order + 1}`,
    judge: `Judge ${String.fromCharCode(65 + order)}`,
    reviewType: text(item.row.Review_Type) || "Review",
    createdAt: item.createdAt,
    row: item.row,
  }));

  const byType = new Map<string, IndexedReview[]>();
  for (const review of indexed) {
    const list = byType.get(review.reviewType) || [];
    list.push(review);
    byType.set(review.reviewType, list);
  }

  const preferredOrder = [INITIAL_REVIEW_TYPE, PITCH_REVIEW_TYPE];
  const types = [
    ...preferredOrder.filter((type) => byType.has(type)),
    ...[...byType.keys()].filter((type) => !preferredOrder.includes(type)).sort(),
  ];

  const rounds = types.map((reviewType) => buildRound(reviewType, byType.get(reviewType) || []));

  return {
    applicationId: input.applicationId,
    projectName: input.projectName,
    summary: (input.summary || "").trim(),
    mode: input.mode,
    reviewCount: indexed.length,
    omittedConflict,
    rounds,
    warning: input.warning,
  };
}

function buildRound(reviewType: string, reviews: IndexedReview[]): FeedbackRound {
  const questions: FeedbackQuestion[] = [];
  for (const field of RUBRIC_QUESTIONS) {
    const question = buildQuestion(field.id, field.title, field.score, field.comment, reviews);
    if (question.chips.some((chip) => chip.value != null || chip.raw) || question.comments.length) {
      questions.push(question);
    }
  }
  for (const field of LEGACY_QUESTIONS) {
    const question = buildQuestion(field.id, field.title, field.score, field.comment, reviews);
    if (question.chips.some((chip) => chip.value != null || chip.raw) || question.comments.length) {
      questions.push(question);
    }
  }

  const strengths = collectComments(reviews, "Final_Feedback_or_Outstanding_Questions_for_Team");
  const legacyNotes = collectComments(reviews, "Initial_Feedback");
  const improvements = collectComments(reviews, "Areas_for_Improvement");

  return {
    id: slugType(reviewType),
    reviewType,
    label: roundLabel(reviewType),
    reviewCount: reviews.length,
    questions,
    strengths: [...strengths, ...legacyNotes],
    improvements,
  };
}

function buildQuestion(
  id: string,
  title: string,
  scoreKey: string,
  commentKey: string,
  reviews: IndexedReview[],
): FeedbackQuestion {
  const chips: FeedbackScoreChip[] = [];
  const comments: FeedbackComment[] = [];
  const values: number[] = [];

  for (const review of reviews) {
    const raw = text(review.row[scoreKey]);
    const value = parseScore(raw);
    if (raw || value != null) {
      chips.push({
        judge: review.judge,
        value,
        label: value != null ? `${value} ${SHORT_RATING[value] || ""}`.trim() : raw,
        raw,
      });
      if (value != null) values.push(value);
    }
    const comment = text(review.row[commentKey]);
    if (comment) comments.push({ judge: review.judge, text: comment });
  }

  return {
    id,
    title,
    average: average(values),
    spread: spreadLabel(values),
    chips,
    comments,
  };
}

function collectComments(reviews: IndexedReview[], key: string): FeedbackComment[] {
  return reviews.flatMap((review) => {
    const textValue = text(review.row[key]);
    return textValue ? [{ judge: review.judge, text: textValue }] : [];
  });
}

export function parseScore(value: unknown): number | null {
  const raw = text(value);
  if (!raw) return null;
  const leading = /^([1-5])\b/.exec(raw);
  if (leading) return Number(leading[1]);
  for (const [score, label] of Object.entries(RATING_TEXT)) {
    if (raw === label || raw.toLowerCase() === SHORT_RATING[Number(score)]?.toLowerCase()) {
      return Number(score);
    }
  }
  return null;
}

export function isConflict(row: RawReview) {
  return /^yes$/i.test(text(row.Conflict_of_Interest));
}

function isDeleted(row: RawReview) {
  if (row.Deleted === true || row.deleted === true) return true;
  const status = text(row.Status).toLowerCase();
  return status === "deleted" || status === "trashed";
}

function roundLabel(reviewType: string) {
  if (reviewType === INITIAL_REVIEW_TYPE) return "Initial judge review";
  if (reviewType === PITCH_REVIEW_TYPE) return "Pitch / funding recommendation";
  return reviewType;
}

function slugType(reviewType: string) {
  return reviewType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "review";
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function spreadLabel(values: number[]) {
  if (!values.length) return "—";
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return `${min}`;
  return `${min}–${max}`;
}

function createdTime(row: RawReview) {
  return text(row.Created_Time) || text(row.Modified_Time) || text(row.id) || "";
}

function lookupId(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return text((value as { id?: unknown }).id);
  }
  return text(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

/** Sample document for mock mode / unit tests. */
export function sampleFeedbackReviews(applicationId: string): RawReview[] {
  const base = {
    Application1: { id: applicationId },
    Review_Type: INITIAL_REVIEW_TYPE,
    Conflict_of_Interest: "No",
    Status: "Submitted",
  };
  return [
    {
      ...base,
      id: "sample-a",
      Created_Time: "2026-09-01T10:00:00-04:00",
      Rating_for_Potential_for_Positive_Impact: RATING_TEXT[4],
      Positive_Impact_Feedback: "Growers can name the film they want swapped.",
      Rating_for_Value_Proposition: RATING_TEXT[4],
      Value_Proposition_Feedback: "",
      Sustainability_and_Viability_of_the_Venture: RATING_TEXT[3],
      Viability_Feedback: "The price still needs a buyer.",
      Rating_for_Freedom_to_Operate: RATING_TEXT[4],
      Feedback_for_Freedom_to_Operate: "",
      Rating_for_Go_to_Market: RATING_TEXT[4],
      Feedback_for_Go_to_Market: "",
      Final_Feedback_or_Outstanding_Questions_for_Team: "Growers already asked to pilot two films.",
      Areas_for_Improvement: "The price needs a buyer, not just a grower.",
    },
    {
      ...base,
      id: "sample-b",
      Created_Time: "2026-09-02T11:00:00-04:00",
      Rating_for_Potential_for_Positive_Impact: RATING_TEXT[5],
      Positive_Impact_Feedback: "The fog case is specific and urgent.",
      Rating_for_Value_Proposition: RATING_TEXT[4],
      Value_Proposition_Feedback: "Clear swap story.",
      Sustainability_and_Viability_of_the_Venture: RATING_TEXT[4],
      Viability_Feedback: "",
      Rating_for_Freedom_to_Operate: RATING_TEXT[5],
      Feedback_for_Freedom_to_Operate: "",
      Rating_for_Go_to_Market: RATING_TEXT[3],
      Feedback_for_Go_to_Market: "Name the first three growers who will pay.",
      Final_Feedback_or_Outstanding_Questions_for_Team: "Strong discovery work.",
      Areas_for_Improvement: "Sharpen the first paying customer path.",
    },
    {
      ...base,
      id: "sample-coi",
      Created_Time: "2026-09-03T09:00:00-04:00",
      Conflict_of_Interest: "Yes",
      Rating_for_Potential_for_Positive_Impact: RATING_TEXT[1],
      Final_Feedback_or_Outstanding_Questions_for_Team: "Should be dropped.",
      Areas_for_Improvement: "Should be dropped.",
    },
  ];
}
