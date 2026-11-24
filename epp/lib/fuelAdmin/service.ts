import { SAMPLE_APPLICATIONS } from "@/lib/fuelJudge/catalog";
import { dealToApplication, FUEL_DEAL_FIELDS } from "@/lib/fuelJudge/mapping";
import { FuelJudgeError, fuelCrmMode } from "@/lib/fuelJudge/service";
import { getZohoAccessToken, readZohoCatalog, rememberZohoCatalog, ZohoRateLimitError, ZohoTokenError } from "@/lib/zohoToken";
import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";
import {
  applyEditable,
  crmPayload,
  diffEditable,
  parseEditable,
  readEditable,
  type DealChange,
  type EditableDeal,
} from "./fields";
import { loadFuelAdminState, recordFuelAdminChange, type FuelAuditEntry } from "./store";

export type FuelDealWriter = {
  updateDeal: (id: string, fields: Record<string, string | number | null>) => Promise<{ id: string }>;
};

export function fuelAdminWritesEnabled() {
  return fuelCrmMode() === "live" && process.env.FUEL_ADMIN_WRITES === "1";
}

export async function listFuelPipeline(options?: {
  durable?: boolean;
  source?: () => Promise<FuelApplication[]>;
}) {
  const state = await loadFuelAdminState({ durable: options?.durable });
  const source = options?.source ?? listFromConfiguredSource;
  try {
    const applications = (await source())
      .filter((row) => (FUEL_PIPELINES as readonly string[]).includes(row.pipeline))
      .map((row) => mergeOverlay(row, state.overlays[row.id]));
    return {
      mode: fuelCrmMode(),
      writesEnabled: fuelAdminWritesEnabled(),
      applications,
      audit: state.audit.slice(-12).reverse(),
      syncing: false,
    };
  } catch (err) {
    if (!(err instanceof ZohoRateLimitError)) throw err;
    const applications = err.applications
      .filter((row) => (FUEL_PIPELINES as readonly string[]).includes(row.pipeline))
      .map((row) => mergeOverlay(row, state.overlays[row.id]));
    return {
      mode: fuelCrmMode(),
      writesEnabled: fuelAdminWritesEnabled(),
      applications,
      audit: state.audit.slice(-12).reverse(),
      syncing: true,
    };
  }
}

export async function updateFuelApplication(
  applicationId: string,
  fields: unknown,
  actor: { email: string },
  options?: {
    durable?: boolean;
    source?: () => Promise<FuelApplication[]>;
    writer?: FuelDealWriter;
  },
) {
  const email = actor.email.trim().toLowerCase();
  if (!email) throw new FuelJudgeError("Sign in as an admin.", 401);
  const parsed = parseEditable(fields);
  if (!parsed.value) throw new FuelJudgeError(parsed.error || "Those fields cannot be saved.", 400);
  const listed = await listFuelPipeline({ durable: options?.durable, source: options?.source });
  const current = listed.applications.find((row) => row.id === applicationId);
  if (!current) throw new FuelJudgeError("That application is not in a Fuel pipeline.", 404);
  if (!(FUEL_PIPELINES as readonly string[]).includes(current.pipeline)) {
    throw new FuelJudgeError("That application is not in a Fuel pipeline.", 404);
  }
  const changes = diffEditable(readEditable(current), parsed.value);
  if (!changes.length) throw new FuelJudgeError("No fields changed.", 400);
  const record = crmPayload(changes);
  const wrote = fuelAdminWritesEnabled();
  if (wrote) {
    const writer = options?.writer ?? { updateDeal: updateDealInZoho };
    await writer.updateDeal(current.id, record);
  }
  const entry: FuelAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    email,
    applicationId: current.id,
    projectName: parsed.value.projectName,
    pipeline: parsed.value.pipeline,
    wrote,
    changes: changes.map((change) => ({
      field: change.crm,
      label: change.label,
      old: change.old,
      new: change.new,
    })),
  };
  await recordFuelAdminChange(
    entry,
    wrote || fuelCrmMode() === "live" ? null : { id: current.id, fields: parsed.value },
    { durable: options?.durable },
  );
  return {
    wrote,
    application: applyEditable(current, parsed.value),
    changes: entry.changes,
    record,
  };
}

function mergeOverlay(application: FuelApplication, overlay: EditableDeal | undefined) {
  if (!overlay || fuelCrmMode() === "live") return application;
  return applyEditable(application, overlay);
}

async function listFromConfiguredSource() {
  if (fuelCrmMode() !== "live") return SAMPLE_APPLICATIONS.map((row) => ({ ...row, initialFeedback: [...row.initialFeedback] }));
  let token: string;
  try {
    token = await getZohoAccessToken();
  } catch (err) {
    if (err instanceof ZohoRateLimitError) throw new ZohoRateLimitError(await readZohoCatalog("admin") ?? []);
    throw tokenFailure(err);
  }
  const domain = requiredEnv("FUEL_ZOHO_API_DOMAIN");
  const pipelines = FUEL_PIPELINES.map((pipeline) => `'${pipeline.replace(/'/g, "")}'`).join(",");
  const rows = await coql(token, domain, `select ${FUEL_DEAL_FIELDS} from Deals where Pipeline in (${pipelines}) limit 200`);
  const applications = rows
    .map((row) => dealToApplication(row))
    .filter((row): row is FuelApplication => Boolean(row))
    .filter((row) => (FUEL_PIPELINES as readonly string[]).includes(row.pipeline));
  await rememberZohoCatalog("admin", applications);
  return applications;
}

async function updateDealInZoho(id: string, fields: Record<string, string | number | null>) {
  if (!fuelAdminWritesEnabled()) throw new FuelJudgeError("Fuel admin writes are off.", 403);
  const allowed = new Set(["Stage", "Pipeline", "Project_Name", "One_Sentence_Project_Summary", "Project_Industries", "What_Funding_Are_You_Requesting", "PDF_URL", "Budget_URL", "Quad_Chart", "Technical_Evidence_URL", "Proof_of_Traction_URL", "Images_URL", "Supporting_URL", "Video_demo_etc_URL", "Additional_Doc_URL"]);
  const data: Record<string, string | number | null> = { id };
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.has(key)) continue;
    if (key === "Stage" && !(FUEL_STATUSES as readonly string[]).includes(String(value))) {
      throw new FuelJudgeError("Choose a Fuel stage.", 400);
    }
    if (key === "Pipeline" && !(FUEL_PIPELINES as readonly string[]).includes(String(value))) {
      throw new FuelJudgeError("Pipeline must stay on a Fuel pipeline.", 400);
    }
    data[key] = value;
  }
  const token = await fuelAccessToken();
  const domain = requiredEnv("FUEL_ZOHO_API_DOMAIN");
  const response = await fetch(`${domain}/crm/v8/Deals`, {
    method: "PUT",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: [data], trigger: [] }),
  });
  const payload = (await response.json().catch(() => null)) as {
    data?: { details?: { id?: string }; status?: string; message?: string }[];
  } | null;
  const row = payload?.data?.[0];
  if (!response.ok || row?.status === "error" || !row?.details?.id) {
    throw new FuelJudgeError(row?.message || "Fuel CRM did not accept the update.", 502);
  }
  return { id: row.details.id };
}

async function coql(token: string, domain: string, selectQuery: string) {
  const response = await fetch(`${domain}/crm/v8/coql`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ select_query: selectQuery }),
  });
  if (response.status === 204) return [];
  const payload = (await response.json()) as { data?: Record<string, unknown>[]; message?: string };
  if (!response.ok) throw new FuelJudgeError(payload.message || "Fuel CRM could not be read.", 502);
  return payload.data || [];
}

async function fuelAccessToken() {
  try {
    return await getZohoAccessToken();
  } catch (err) {
    throw tokenFailure(err);
  }
}

function tokenFailure(err: unknown): Error {
  if (err instanceof ZohoRateLimitError) return new FuelJudgeError("CRM syncing. Try again in a few minutes.", 503);
  if (err instanceof ZohoTokenError) return new FuelJudgeError(err.message, err.status);
  return err instanceof Error ? err : new FuelJudgeError("Fuel CRM credentials were not accepted.", 502);
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new FuelJudgeError("Fuel CRM is not configured.", 503);
  return value.replace(/\/$/, "");
}

export type { DealChange };
