import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "../fuelJudge/types";

export const REQUIRED_DOCS = [
  { key: "fuelApplicationUrl", label: "Fuel application" },
  { key: "budgetUrl", label: "Budget" },
  { key: "quadChartUrl", label: "Quad chart" },
  { key: "technicalEvidenceUrl", label: "Technical evidence" },
  { key: "tractionUrl", label: "Proof of traction" },
] as const;

export const SUPPORTING_DOCS = [
  { key: "imagesUrl", label: "Images" },
  { key: "pitchDeckUrl", label: "Pitch deck" },
  { key: "videoUrl", label: "Video" },
  { key: "additionalUrl", label: "Additional document" },
] as const;

/** Stages where a judge is expected to be reading or deciding. */
export const IN_REVIEW_STAGES = [
  "Ready For Initial Review",
  "Out For Initial Review",
  "Initial Feedback Returned",
  "Invited For Presentation",
  "Student Invited to Meet with Fuel staff",
  "Out For Funding Decision",
  "Award Tentatively Approved",
] as const;

/** Already sent to judges, so a missing review is an action. */
export const AWAITING_FEEDBACK_STAGES = [
  "Out For Initial Review",
  "Initial Feedback Returned",
  "Invited For Presentation",
  "Student Invited to Meet with Fuel staff",
  "Out For Funding Decision",
] as const;

export const AWARDED_STAGES = ["Funding Awarded", "Award Tentatively Approved"] as const;

export function awardedCount(applications: FuelApplication[]) {
  const stages = new Set<string>(AWARDED_STAGES);
  return applications.filter((application) => stages.has(application.stage)).length;
}

/** Keep known Fuel order; append any live CRM stages we have not listed yet. */
export function orderedStages(present: Iterable<string> = []) {
  const order = [...FUEL_STATUSES] as string[];
  for (const stage of present) {
    if (stage && !order.includes(stage)) order.push(stage);
  }
  return order;
}

type DocKey = (typeof REQUIRED_DOCS)[number]["key"] | (typeof SUPPORTING_DOCS)[number]["key"];

export function dedupeById(applications: FuelApplication[]) {
  const seen = new Set<string>();
  const rows: FuelApplication[] = [];
  for (const application of applications) {
    if (!application.id || seen.has(application.id)) continue;
    seen.add(application.id);
    rows.push(application);
  }
  return rows;
}

export function documentChecklist(application: FuelApplication) {
  return [...REQUIRED_DOCS, ...SUPPORTING_DOCS].map((doc) => {
    const url = application[doc.key as DocKey];
    return {
      key: doc.key,
      label: doc.label,
      url: typeof url === "string" && url ? url : null,
      required: REQUIRED_DOCS.some((item) => item.key === doc.key),
    };
  });
}

export function completeness(application: FuelApplication) {
  const present = REQUIRED_DOCS.filter((doc) => {
    const url = application[doc.key];
    return typeof url === "string" && url.length > 0;
  }).length;
  return { present, required: REQUIRED_DOCS.length };
}

export function missingRequired(application: FuelApplication) {
  return completeness(application).present < REQUIRED_DOCS.length;
}

export function formatMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fundingSum(applications: FuelApplication[]) {
  let sum = 0;
  let known = 0;
  for (const application of applications) {
    if (typeof application.fundingRequested === "number" && Number.isFinite(application.fundingRequested)) {
      sum += application.fundingRequested;
      known += 1;
    }
  }
  return { sum, known, missing: applications.length - known };
}

export function inReviewCount(applications: FuelApplication[]) {
  const stages = new Set<string>(IN_REVIEW_STAGES);
  return applications.filter((application) => stages.has(application.stage)).length;
}

export function reviewTotals(applications: FuelApplication[]) {
  let sum = 0;
  let known = 0;
  for (const application of applications) {
    if (typeof application.totalReviews === "number" && Number.isFinite(application.totalReviews)) {
      sum += application.totalReviews;
      known += 1;
    }
  }
  return { sum, known, unknown: applications.length - known };
}

export function stageSlug(stage: string) {
  return stage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function pipelineLabel(pipeline: string) {
  if (pipeline === "Fuel Consumer IT") return "Consumer IT";
  if (pipeline === "Fuel Jumpstart") return "Jumpstart";
  return pipeline;
}

/** CSS tone suffix for pipeline chips: Fuel / Jumpstart / Consumer IT. */
export function pipelineTone(pipeline: string) {
  if (pipeline === "Fuel Jumpstart") return "jumpstart";
  if (pipeline === "Fuel Consumer IT") return "consumer-it";
  if (pipeline === "Fuel") return "fuel";
  return "other";
}

export function pipelineChipClass(pipeline: string) {
  return `pipeline-chip pipeline-${pipelineTone(pipeline)}`;
}

export function funnel(applications: FuelApplication[]) {
  return FUEL_STATUSES.map((stage) => ({
    stage,
    count: applications.filter((application) => application.stage === stage).length,
  }));
}

export function bottleneck(applications: FuelApplication[]) {
  const rows = funnel(applications);
  const top = rows.reduce((best, row) => (row.count > best.count ? row : best), rows[0]);
  return top && top.count > 0 ? top : null;
}

export function pipelineBreakdown(applications: FuelApplication[]) {
  return FUEL_PIPELINES.map((pipeline) => {
    const rows = applications.filter((application) => application.pipeline === pipeline);
    return { pipeline, count: rows.length, funding: fundingSum(rows).sum };
  });
}

export function storedCounts(reviews: { applicationId: string }[]) {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    counts.set(review.applicationId, (counts.get(review.applicationId) || 0) + 1);
  }
  return counts;
}

export function hasJudgeFeedback(application: FuelApplication, stored: number) {
  if (stored > 0) return true;
  if (application.initialFeedback.length > 0) return true;
  return typeof application.totalReviews === "number" && application.totalReviews > 0;
}

export function feedbackBadge(application: FuelApplication, stored: number) {
  if (typeof application.totalReviews === "number" && Number.isFinite(application.totalReviews)) {
    return application.totalReviews + stored;
  }
  return stored > 0 ? stored : null;
}

export function awaitingFeedback(applications: FuelApplication[], counts: Map<string, number>) {
  const stages = new Set<string>(AWAITING_FEEDBACK_STAGES);
  return applications.filter(
    (application) => stages.has(application.stage) && !hasJudgeFeedback(application, counts.get(application.id) || 0),
  );
}

export function staleApplications(applications: FuelApplication[], limit = 5) {
  return applications
    .flatMap((application) => {
      if (!application.modifiedTime) return [];
      const at = Date.parse(application.modifiedTime);
      if (!Number.isFinite(at)) return [];
      return [{ application, at }];
    })
    .sort((a, b) => a.at - b.at)
    .slice(0, limit);
}

export function formatEdited(value: string | null | undefined) {
  if (!value) return "";
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(at);
}

export const DAYS_IN_STAGE_REASON =
  "Fuel deals include Modified_Time, the last edit, not the time the current stage started.";

export const AWARDED_DOLLARS_REASON =
  "No awarded-dollar field is mapped on these deals. Funding Awarded is a stage, not an amount.";

export function daysSinceLastEdit(value: string | null | undefined, now = Date.now()) {
  if (!value) return null;
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return null;
  return Math.max(0, Math.floor((now - at) / 86_400_000));
}

export function buildInsights(
  applications: FuelApplication[],
  reviews: { applicationId: string; dryRun?: boolean }[] = [],
  now = Date.now(),
) {
  const funding = fundingSum(applications);
  return {
    daysInStage: null,
    daysInStageReason: DAYS_IN_STAGE_REASON,
    funding: {
      requested: funding.sum,
      applicationsWithAmount: funding.known,
      applicationsMissingAmount: funding.missing,
      awarded: null,
      awardedReason: AWARDED_DOLLARS_REASON,
      byPipeline: pipelineBreakdown(applications),
      byStage: funnel(applications).map((item) => ({
        ...item,
        requested: fundingSum(applications.filter((application) => application.stage === item.stage)).sum,
      })),
    },
    applications: applications.map((application) => {
      const checklist = documentChecklist(application);
      const complete = completeness(application);
      const mine = reviews.filter((review) => review.applicationId === application.id);
      return {
        id: application.id,
        projectName: application.projectName,
        stage: application.stage,
        pipeline: application.pipeline,
        fundingRequested: application.fundingRequested,
        modifiedTime: application.modifiedTime ?? null,
        daysSinceLastEdit: daysSinceLastEdit(application.modifiedTime, now),
        daysInStage: null,
        completeness: {
          present: complete.present,
          required: complete.required,
          missing: checklist.filter((item) => item.required && !item.url).map((item) => item.label),
        },
        feedback: {
          crmCount: application.totalReviews,
          notes: application.initialFeedback,
          deskCount: mine.filter((review) => review.dryRun !== false).length,
          reviews: mine,
        },
      };
    }),
  };
}
