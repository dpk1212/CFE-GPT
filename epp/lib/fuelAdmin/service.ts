import { SAMPLE_APPLICATIONS } from "@/lib/fuelJudge/catalog";
import { dealToApplication, FUEL_DEAL_FIELDS } from "@/lib/fuelJudge/mapping";
import { FuelJudgeError, fuelCrmMode } from "@/lib/fuelJudge/service";
import { crmWriteEnvelope, crmWriteRequest } from "@/lib/zohoWrite";
import { postCoqlAll } from "@/lib/zohoCoql";
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
import { mergeStageOrder } from "./metrics";
import { loadFuelAdminState, recordFuelAdminChange, saveFuelStageOrder, type FuelAuditEntry } from "./store";

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
    const listed = await source();
    const applications = listed
      .filter((row) => (FUEL_PIPELINES as readonly string[]).includes(row.pipeline))
      .map((row) => mergeOverlay(row, state.overlays[row.id]));
    return {
      mode: fuelCrmMode(),
      writesEnabled: fuelAdminWritesEnabled(),
      applications,
      audit: state.audit.slice(-12).reverse(),
      stageOrder: state.stageOrder,
      truncated: listedMeta(listed).truncated,
      omitted: listedMeta(listed).omitted,
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
      stageOrder: state.stageOrder,
      truncated: false,
      omitted: 0,
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
    request: wrote ? undefined : crmWriteRequest("PUT", "/crm/v8/Deals", { id: current.id, ...record }),
  };
}

export type StageMoveRow = {
  id: string;
  projectName: string;
  from: string;
  to: string;
};

export type StageMoveFailure = {
  id: string;
  projectName: string;
  error: string;
};

/** Move Stage on each Fuel deal. One rejection does not undo the deals that already updated. */
export async function updateFuelStages(
  applicationIds: string[],
  stage: string,
  actor: { email: string },
  options?: {
    durable?: boolean;
    source?: () => Promise<FuelApplication[]>;
    writer?: FuelDealWriter;
  },
) {
  const email = actor.email.trim().toLowerCase();
  if (!email) throw new FuelJudgeError("Sign in as an admin.", 401);
  const target = stage.trim();
  if (!(FUEL_STATUSES as readonly string[]).includes(target)) {
    throw new FuelJudgeError("Choose a Fuel stage.", 400);
  }
  const ids = [...new Set(applicationIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length) throw new FuelJudgeError("Choose at least one application.", 400);
  if (!fuelAdminWritesEnabled()) throw new FuelJudgeError("Fuel admin writes are off.", 403);

  const listed = await listFuelPipeline({ durable: options?.durable, source: options?.source });
  const writer = options?.writer ?? { updateDeal: updateDealInZoho };
  const updated: StageMoveRow[] = [];
  const unchanged: { id: string; projectName: string; stage: string }[] = [];
  const failed: StageMoveFailure[] = [];

  for (const id of ids) {
    const current = listed.applications.find((row) => row.id === id);
    if (!current || !(FUEL_PIPELINES as readonly string[]).includes(current.pipeline)) {
      failed.push({
        id,
        projectName: current?.projectName || id,
        error: "That application is not in a Fuel pipeline.",
      });
      continue;
    }
    if (current.stage === target) {
      unchanged.push({ id: current.id, projectName: current.projectName, stage: current.stage });
      continue;
    }
    let written = false;
    try {
      await writer.updateDeal(current.id, { Stage: target });
      written = true;
      const entry: FuelAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        email,
        applicationId: current.id,
        projectName: current.projectName,
        pipeline: current.pipeline,
        wrote: true,
        changes: [{ field: "Stage", label: "Stage", old: current.stage, new: target }],
      };
      await recordFuelAdminChange(entry, null, { durable: options?.durable });
      updated.push({ id: current.id, projectName: current.projectName, from: current.stage, to: target });
    } catch (err) {
      const message = err instanceof Error ? err.message : "The stage was not updated.";
      failed.push({
        id: current.id,
        projectName: current.projectName,
        error: written ? `Stage was updated, but the audit log failed: ${message}` : message,
      });
    }
  }

  return { wrote: true, stage: target, updated, unchanged, failed };
}

/** Display order only. This does not write a deal or change a Zoho stage. */
export async function updateFuelStageOrder(visibleOrder: string[] | null, options?: { durable?: boolean }) {
  const state = await loadFuelAdminState({ durable: options?.durable });
  if (visibleOrder === null) {
    const saved = await saveFuelStageOrder([], { durable: options?.durable });
    return { stageOrder: saved.stageOrder };
  }
  const names = visibleOrder.map((stage) => stage.trim()).filter(Boolean);
  if (!names.length) throw new FuelJudgeError("Choose a stage order.", 400);
  const saved = await saveFuelStageOrder(mergeStageOrder(state.stageOrder, names), { durable: options?.durable });
  return { stageOrder: saved.stageOrder };
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
  const collected = await postCoqlAll(token, domain, `select ${FUEL_DEAL_FIELDS} from Deals where Pipeline in (${pipelines})`);
  if (!collected.ok) throw new FuelJudgeError(collected.message, 502);
  const mapped = collected.rows.map((row) => dealToApplication(row));
  const applications = mapped
    .filter((row): row is FuelApplication => Boolean(row))
    .filter((row) => (FUEL_PIPELINES as readonly string[]).includes(row.pipeline));
  const listed = applications as FuelApplication[] & { truncated?: boolean; omitted?: number };
  listed.truncated = collected.truncated;
  listed.omitted = mapped.filter((row) => !row).length;
  await rememberZohoCatalog("admin", applications);
  return listed;
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
    body: JSON.stringify(crmWriteEnvelope(data)),
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

function listedMeta(applications: FuelApplication[]) {
  const extra = applications as FuelApplication[] & { truncated?: boolean; omitted?: number };
  return { truncated: Boolean(extra.truncated), omitted: extra.omitted ?? 0 };
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
