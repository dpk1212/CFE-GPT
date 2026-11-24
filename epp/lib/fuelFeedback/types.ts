export const RUBRIC_URL = "https://royai.ch/cmBSD";

export const INITIAL_REVIEW_TYPE = "Fuel initial judge review";
export const PITCH_REVIEW_TYPE = "Funding Recommendation";

export type FeedbackScoreChip = {
  judge: string;
  value: number | null;
  label: string;
  raw: string;
};

export type FeedbackComment = {
  judge: string;
  text: string;
};

export type FeedbackQuestion = {
  id: string;
  title: string;
  average: number | null;
  spread: string;
  chips: FeedbackScoreChip[];
  comments: FeedbackComment[];
};

export type FeedbackRound = {
  id: string;
  reviewType: string;
  label: string;
  reviewCount: number;
  questions: FeedbackQuestion[];
  strengths: FeedbackComment[];
  improvements: FeedbackComment[];
};

export type FeedbackDocument = {
  applicationId: string;
  projectName: string;
  summary: string;
  mode: "live" | "mock";
  reviewCount: number;
  omittedConflict: number;
  rounds: FeedbackRound[];
  warning?: string;
};
