export const FUEL_PIPELINES = [
  "Fuel",
  "Fuel Consumer IT",
  "Fuel Jumpstart",
] as const;

export const FUEL_STATUSES = [
  "Needs Completeness Check",
  "Student Revision Needed",
  "Ready For Initial Review",
  "Out For Initial Review",
  "Initial Feedback Returned",
  "Invited For Presentation",
  "Student Invited to Meet with Fuel staff",
  "Not Invited To Present",
  "Out For Funding Decision",
  "Award Tentatively Approved",
  "Funding Awarded",
  "No Funding",
] as const;

export const FUEL_COLUMNS = [
  "totalReviews",
  "projectName",
  "summary",
  "industries",
  "fuelApplication",
  "fundingRequested",
  "budgetUrl",
  "quadChart",
  "technicalEvidence",
  "traction",
  "images",
  "pitchDeck",
  "video",
  "additional",
  "initialFeedback",
] as const;

export type FuelColumnId = (typeof FUEL_COLUMNS)[number];
export type FuelFormId = "written" | "pitch";

export type FuelStageConfig = {
  id: string;
  name: string;
  form: FuelFormId;
  statuses: string[];
  pipelines: string[];
  columns: FuelColumnId[];
};

export type FuelJudgeConfig = {
  activeStageId: string;
  stages: FuelStageConfig[];
};

export type FuelApplication = {
  id: string;
  projectName: string;
  stage: string;
  pipeline: string;
  totalReviews: number | null;
  summary: string;
  industries: string;
  fuelApplicationUrl: string | null;
  fundingRequested: number | null;
  budgetUrl: string | null;
  quadChartUrl: string | null;
  technicalEvidenceUrl: string | null;
  tractionUrl: string | null;
  imagesUrl: string | null;
  pitchDeckUrl: string | null;
  videoUrl: string | null;
  additionalUrl: string | null;
  /** Last CRM edit. This is not the time the deal entered its current stage. */
  modifiedTime?: string | null;
  /** Stage-1 strengths and improvement notes already on the application. */
  initialFeedback: string[];
};

export type WrittenReviewInput = {
  form: "written";
  applicationId: string;
  conflict: "Yes" | "No";
  confidentiality: true;
  ratings: {
    problem: number;
    solution: number;
    market: number;
    freedom: number;
    execution: number;
  };
  feedback: {
    problem?: string;
    solution?: string;
    market?: string;
    freedom?: string;
    execution?: string;
  };
  strengths?: string;
  improvements?: string;
  advance: "yes" | "no";
  coach?: string;
  internalNotes?: string;
};

export type PitchReviewInput = {
  form: "pitch";
  applicationId: string;
  conflict?: "Yes" | "No" | "";
  confidentiality: true;
  didWell?: string;
  prioritize?: string;
  coach?: string;
  funding: "yes" | "no";
  internalNotes?: string;
};

export type ReviewInput = WrittenReviewInput | PitchReviewInput;

export type ReviewerIdentity = {
  email: string;
  name: string;
};
