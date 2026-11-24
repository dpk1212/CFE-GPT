import { FUEL_COLUMNS, type FuelColumnId } from "./types";

export const COLUMN_LABELS: Record<FuelColumnId, string> = {
  totalReviews: "Total Reviews",
  projectName: "Project Name",
  summary: "One Sentence Summary/VP",
  industries: "Industries",
  fuelApplication: "Fuel Application",
  fundingRequested: "Funding Requested",
  budgetUrl: "Budget",
  quadChart: "Quad Chart",
  technicalEvidence: "Technical Evidence",
  traction: "Proof of Traction",
  images: "Images",
  pitchDeck: "Pitch Deck",
  video: "Video",
  additional: "Add'l",
  initialFeedback: "Initial Judge Feedback",
};

export const RATING_SCALE = [
  { value: 1, label: "Missing / Unclear" },
  { value: 2, label: "Weak / Limited" },
  { value: 3, label: "Clear / Adequate" },
  { value: 4, label: "Strong / Compelling" },
  { value: 5, label: "Exceptional / Pitch-Ready" },
] as const;

export const WRITTEN_RUBRIC = [
  {
    key: "problem" as const,
    title: "Problem Validation & Customer Discovery",
    hint: "Application sections 1–2: Real-World and Societal Impact; Evidence of Problem.",
    consider:
      "Does the team show evidence of a real, validated problem? Have they engaged potential customers or stakeholders? Is the problem clearly defined and worth solving?",
  },
  {
    key: "solution" as const,
    title: "Solution & Value Proposition",
    hint: "Sections 3–4: Value Prop & Differentiation; Solution & Product Overview. Attachments required if the ask is above $5,000: Proof of Traction and Technical Evidence.",
    consider:
      "Is the solution clearly described and feasible? Does the value proposition make sense for the target user or customer? Is there evidence the solution could work (technical, pilot, or early market signals)?",
  },
  {
    key: "market" as const,
    title: "Market Entry & Business Model",
    hint: "Sections 5–6: Financial Viability & Business Model; Go-To-Market.",
    consider:
      "Is there a credible path to reaching customers? Does the business model make sense for this stage? Are key risks or assumptions acknowledged?",
  },
  {
    key: "freedom" as const,
    title: "Freedom to Operate",
    hint: "Section 7: Freedom to Operate.",
    consider:
      "Has the team considered IP ownership, licensing, or other barriers? Are there obvious red flags or missing steps?",
  },
  {
    key: "execution" as const,
    title: "Execution Plan & Budget Fit",
    hint: "Section 9: 12-Week Action Plan; budget attachment maps each expense to a milestone.",
    consider:
      "Does the plan show meaningful progress in 12 weeks? Are milestones realistic and tied to validation or de-risking? Does the budget clearly map expenses to milestones?",
  },
];

/** Preserve admin column toggles in the canonical table order. */
export const COLUMN_ORDER = [...FUEL_COLUMNS];

export const CONFIDENTIALITY_PARAGRAPH =
  "As a judge for the Fuel program, I agree to maintain the confidentiality of all information pertaining to student ventures. I understand that I may have access to proprietary information and sensitive details about these projects. I commit to not disclose, share, or discuss any information regarding the students' ventures outside the context of the Fuel program evaluation process. This confidentiality agreement remains in effect both during and after my involvement with the Fuel program.";

export const FORM_STEPS = {
  written: ["Contact Info", "Ratings and Feedback", "Advice and Submission"],
  pitch: ["Contact Info", "Feedback", "CFE Direct Support"],
} as const;
