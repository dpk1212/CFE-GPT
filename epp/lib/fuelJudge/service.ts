import { getZohoAccessToken, readZohoCatalog, rememberZohoCatalog, ZohoRateLimitError, ZohoTokenError } from "@/lib/zohoToken";
import { SAMPLE_APPLICATIONS, applicationsForStage } from "./catalog";
import {
  buildCrmRecord,
  dealToApplication,
  feedbackFromReview,
  FUEL_DEAL_FIELDS,
  validateReview,
} from "./mapping";
import {
  activeStage,
  getFuelConfig,
  loadFuelJudgeState,
  persistFuelConfig,
  persistSubmission,
  rememberSubmission,
  saveFuelConfig,
} from "./store";
import type {
  FuelApplication,
  FuelJudgeConfig,
  ReviewerIdentity,
  ReviewInput,
} from "./types";

export type FuelCrmClient = {
  listApplications: () => Promise<FuelApplication[]>;
  createReview: (record: Record<string, unknown>) => Promise<{ id: string }>;
};

const STAGE1_REVIEW_TYPE = "Fuel initial judge review";

export function fuelCrmMode() {
  return process.env.FUEL_CRM_MODE === "live" ? "live" : "mock";
}

export function fuelWritesEnabled() {
  return fuelCrmMode() === "live" && process.env.FUEL_CRM_WRITES === "1";
}

export async function fuelDashboard(client: FuelCrmClient = defaultClient(), options?: { durable?: boolean }) {
  if (options?.durable !== false) {
    await loadFuelJudgeState();
  }
  const config = getFuelConfig();
  const stage = activeStage(config);
  try {
    const applications = applicationsForStage(await client.listApplications(), stage);
    return {
      mode: fuelCrmMode(),
      writesEnabled: fuelWritesEnabled(),
      config,
      stage,
      applications,
      syncing: false,
    };
  } catch (err) {
    if (err instanceof ZohoRateLimitError) {
      return {
        mode: fuelCrmMode(),
        writesEnabled: fuelWritesEnabled(),
        config,
        stage,
        applications: applicationsForStage(err.applications, stage),
        syncing: true,
      };
    }
    throw err;
  }
}

export async function submitFuelReview(
  input: ReviewInput,
  reviewer: ReviewerIdentity,
  client: FuelCrmClient = defaultClient(),
  options?: { durable?: boolean },
) {
  if (options?.durable !== false) {
    await loadFuelJudgeState();
  }
  const problem = validateReview(input);
  if (problem) throw new FuelJudgeError(problem, 400);
  if (!reviewer.email.trim()) throw new FuelJudgeError("A signed-in judge email is required.", 400);
  const applications = await client.listApplications();
  const application = applications.find((row) => row.id === input.applicationId);
  if (!application) throw new FuelJudgeError("That application is not on this dashboard.", 404);
  const stage = activeStage();
  const visible = applicationsForStage(applications, stage);
  if (!visible.some((row) => row.id === application.id)) {
    throw new FuelJudgeError("That application is not in the active stage.", 400);
  }
  if (stage.form !== input.form) {
    throw new FuelJudgeError("This review form does not match the active stage.", 400);
  }
  const record = buildCrmRecord(input, application, reviewer);
  if (!fuelWritesEnabled()) {
    const id =
      options?.durable === false ? rememberSubmission(record) : await persistSubmission(record);
    return { id, wrote: false as const, record };
  }
  const created = await client.createReview(record);
  return { id: created.id, wrote: true as const, record };
}

export async function updateFuelConfig(next: FuelJudgeConfig, options?: { durable?: boolean }) {
  try {
    if (options?.durable === false) {
      return saveFuelConfig(next);
    }
    return await persistFuelConfig(next);
  } catch (err) {
    throw new FuelJudgeError(err instanceof Error ? err.message : "Invalid setup", 400);
  }
}

export class FuelJudgeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function defaultClient(): FuelCrmClient {
  return {
    listApplications: listFromConfiguredSource,
    createReview: createInConfiguredSource,
  };
}

async function listFromConfiguredSource() {
  if (fuelCrmMode() !== "live") return SAMPLE_APPLICATIONS.map((row) => ({ ...row }));
  let token: string;
  try {
    token = await getZohoAccessToken();
  } catch (err) {
    if (err instanceof ZohoRateLimitError) throw new ZohoRateLimitError(await readZohoCatalog("judge") ?? []);
    throw tokenFailure(err);
  }
  const domain = requiredEnv("FUEL_ZOHO_API_DOMAIN");
  const config = getFuelConfig();
  const pipelines = [...new Set(config.stages.flatMap((stage) => stage.pipelines))];
  const pipelineClause =
    pipelines.length === 1
      ? `Pipeline = '${escapeCoql(pipelines[0])}'`
      : `Pipeline in (${pipelines.map((pipeline) => `'${escapeCoql(pipeline)}'`).join(",")})`;
  const rows = await coql(
    token,
    domain,
    `select ${FUEL_DEAL_FIELDS} from Deals where ${pipelineClause} limit 200`,
  );
  const applications = rows
    .map((row) => dealToApplication(row))
    .filter((row): row is FuelApplication => Boolean(row));
  let feedback = new Map<string, string[]>();
  try {
    feedback = await stageOneFeedback(
      token,
      domain,
      applications.map((row) => row.id),
    );
  } catch {
    feedback = new Map();
  }
  const listed = applications.map((row) => ({
    ...row,
    initialFeedback: feedback.get(row.id) || [],
  }));
  await rememberZohoCatalog("judge", listed);
  return listed;
}

async function stageOneFeedback(token: string, domain: string, ids: string[]) {
  const byApplication = new Map<string, string[]>();
  if (!ids.length) return byApplication;
  const quoted = ids.map((id) => `'${id.replace(/'/g, "")}'`).join(",");
  const reviews = await coql(
    token,
    domain,
    `select Application1, Review_Type, Final_Feedback_or_Outstanding_Questions_for_Team, Areas_for_Improvement from Application_Review where Application1 in (${quoted}) limit 200`,
  );
  for (const review of reviews) {
    if (text(review.Review_Type) !== STAGE1_REVIEW_TYPE) continue;
    const note = feedbackFromReview(review);
    const applicationId = lookupId(review.Application1);
    if (!note || !applicationId) continue;
    const list = byApplication.get(applicationId) || [];
    list.push(note);
    byApplication.set(applicationId, list);
  }
  return byApplication;
}

async function createInConfiguredSource(record: Record<string, unknown>) {
  if (!fuelWritesEnabled()) {
    throw new FuelJudgeError("Fuel CRM writes are off.", 403);
  }
  const token = await fuelAccessToken();
  const domain = requiredEnv("FUEL_ZOHO_API_DOMAIN");
  const response = await fetch(`${domain}/crm/v8/Application_Review`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: [record], trigger: [] }),
  });
  const payload = (await response.json()) as {
    data?: { details?: { id?: string }; status?: string; message?: string }[];
  };
  const row = payload.data?.[0];
  if (!response.ok || row?.status === "error" || !row?.details?.id) {
    throw new FuelJudgeError(row?.message || "Fuel CRM did not accept the review.", 502);
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
  if (!response.ok) {
    throw new FuelJudgeError(payload.message || "Fuel CRM could not be read.", 502);
  }
  return payload.data || [];
}

async function fuelAccessToken() {
  try {
    return await getZohoAccessToken();
  } catch (err) {
    throw tokenFailure(err);
  }
}

function tokenFailure(err: unknown) {
  if (err instanceof ZohoRateLimitError) return new FuelJudgeError("CRM syncing. Try again in a few minutes.", 503);
  if (err instanceof ZohoTokenError) return new FuelJudgeError(err.message, err.status);
  return err;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new FuelJudgeError("Fuel CRM is not configured.", 503);
  return value.replace(/\/$/, "");
}

function escapeCoql(value: string) {
  return value.replace(/'/g, "");
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
