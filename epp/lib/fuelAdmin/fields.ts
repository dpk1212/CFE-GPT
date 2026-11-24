import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

export type DealFieldKey =
  | "stage"
  | "pipeline"
  | "projectName"
  | "summary"
  | "industries"
  | "fundingRequested"
  | "fuelApplicationUrl"
  | "budgetUrl"
  | "quadChartUrl"
  | "technicalEvidenceUrl"
  | "tractionUrl"
  | "imagesUrl"
  | "pitchDeckUrl"
  | "videoUrl"
  | "additionalUrl";

type FieldKind = "text" | "stage" | "pipeline" | "money" | "url";

type FieldDef = {
  key: DealFieldKey;
  crm: string;
  label: string;
  kind: FieldKind;
};

/** Deal fields this desk already reads. Owner, contact, cycle, and deadline are not among them. */
export const EDITABLE_FIELDS: FieldDef[] = [
  { key: "stage", crm: "Stage", label: "Stage", kind: "stage" },
  { key: "pipeline", crm: "Pipeline", label: "Pipeline", kind: "pipeline" },
  { key: "projectName", crm: "Project_Name", label: "Project name", kind: "text" },
  { key: "summary", crm: "One_Sentence_Project_Summary", label: "One-sentence summary", kind: "text" },
  { key: "industries", crm: "Project_Industries", label: "Industries", kind: "text" },
  { key: "fundingRequested", crm: "What_Funding_Are_You_Requesting", label: "Funding requested", kind: "money" },
  { key: "fuelApplicationUrl", crm: "PDF_URL", label: "Fuel application", kind: "url" },
  { key: "budgetUrl", crm: "Budget_URL", label: "Budget", kind: "url" },
  { key: "quadChartUrl", crm: "Quad_Chart", label: "Quad chart", kind: "url" },
  { key: "technicalEvidenceUrl", crm: "Technical_Evidence_URL", label: "Technical evidence", kind: "url" },
  { key: "tractionUrl", crm: "Proof_of_Traction_URL", label: "Proof of traction", kind: "url" },
  { key: "imagesUrl", crm: "Images_URL", label: "Images", kind: "url" },
  { key: "pitchDeckUrl", crm: "Supporting_URL", label: "Pitch deck", kind: "url" },
  { key: "videoUrl", crm: "Video_demo_etc_URL", label: "Video", kind: "url" },
  { key: "additionalUrl", crm: "Additional_Doc_URL", label: "Additional document", kind: "url" },
];

export type EditableDeal = {
  stage: string;
  pipeline: string;
  projectName: string;
  summary: string;
  industries: string;
  fundingRequested: number | null;
  fuelApplicationUrl: string | null;
  budgetUrl: string | null;
  quadChartUrl: string | null;
  technicalEvidenceUrl: string | null;
  tractionUrl: string | null;
  imagesUrl: string | null;
  pitchDeckUrl: string | null;
  videoUrl: string | null;
  additionalUrl: string | null;
};

export type DealChange = {
  key: DealFieldKey;
  crm: string;
  label: string;
  old: string;
  new: string;
  crmValue: string | number | null;
};

const FIELD_BY_KEY = new Map(EDITABLE_FIELDS.map((field) => [field.key, field]));

export function readEditable(application: FuelApplication): EditableDeal {
  return {
    stage: application.stage,
    pipeline: application.pipeline,
    projectName: application.projectName,
    summary: application.summary,
    industries: application.industries,
    fundingRequested: application.fundingRequested,
    fuelApplicationUrl: application.fuelApplicationUrl,
    budgetUrl: application.budgetUrl,
    quadChartUrl: application.quadChartUrl,
    technicalEvidenceUrl: application.technicalEvidenceUrl,
    tractionUrl: application.tractionUrl,
    imagesUrl: application.imagesUrl,
    pitchDeckUrl: application.pitchDeckUrl,
    videoUrl: application.videoUrl,
    additionalUrl: application.additionalUrl,
  };
}

export function parseEditable(input: unknown): { value?: EditableDeal; error?: string } {
  if (!input || typeof input !== "object") return { error: "Send the application fields." };
  const raw = input as Record<string, unknown>;
  const next = {} as EditableDeal;
  for (const field of EDITABLE_FIELDS) {
    const value = raw[field.key];
    if (field.kind === "money") {
      if (value == null || value === "") {
        next.fundingRequested = null;
        continue;
      }
      const amount = typeof value === "number" ? value : Number(String(value).replace(/[$,]/g, ""));
      if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) {
        return { error: "Funding requested must be a number from 0 to 10000000." };
      }
      next.fundingRequested = Math.round(amount);
      continue;
    }
    if (field.kind === "url" && (value == null || value === "")) {
      (next[field.key] as string | null) = null;
      continue;
    }
    if (typeof value !== "string") return { error: `${field.label} must be text.` };
    const text = value.trim();
    if (field.kind === "stage") {
      if (!(FUEL_STATUSES as readonly string[]).includes(text)) {
        return { error: "Choose a Fuel stage." };
      }
      next.stage = text;
      continue;
    }
    if (field.kind === "pipeline") {
      if (!(FUEL_PIPELINES as readonly string[]).includes(text)) {
        return { error: "Pipeline must stay on Fuel, Fuel Consumer IT, or Fuel Jumpstart." };
      }
      next.pipeline = text;
      continue;
    }
    if (field.kind === "url") {
      if (!text) {
        (next[field.key] as string | null) = null;
        continue;
      }
      if (!/^https?:\/\//i.test(text) || text.length > 2000) {
        return { error: `${field.label} needs an http or https link.` };
      }
      (next[field.key] as string | null) = text;
      continue;
    }
    if (field.key === "projectName" && !text) return { error: "Project name is required." };
    if (text.length > 2000) return { error: `${field.label} is too long.` };
    (next[field.key] as string) = text;
  }
  return { value: next };
}

export function diffEditable(current: EditableDeal, next: EditableDeal): DealChange[] {
  const changes: DealChange[] = [];
  for (const field of EDITABLE_FIELDS) {
    const before = current[field.key];
    const after = next[field.key];
    if (display(before) === display(after)) continue;
    const def = FIELD_BY_KEY.get(field.key);
    if (!def) continue;
    changes.push({
      key: field.key,
      crm: def.crm,
      label: def.label,
      old: display(before),
      new: display(after),
      crmValue: after,
    });
  }
  return changes;
}

export function crmPayload(changes: DealChange[]) {
  const record: Record<string, string | number | null> = {};
  for (const change of changes) record[change.crm] = change.crmValue;
  return record;
}

export function applyEditable(application: FuelApplication, next: EditableDeal): FuelApplication {
  return { ...application, ...next };
}

function display(value: string | number | null) {
  if (value == null || value === "") return "";
  return String(value);
}
