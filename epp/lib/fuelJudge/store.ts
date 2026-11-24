import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloneConfig } from "./defaults";
import type { FuelJudgeConfig, FuelStageConfig } from "./types";
import { FUEL_COLUMNS, FUEL_PIPELINES, FUEL_STATUSES } from "./types";

const BLOB_PATH = "epp/fuel-judge.json";

export type FuelJudgeState = {
  config: FuelJudgeConfig;
  submissions: Record<string, unknown>[];
};

let memory: FuelJudgeState = {
  config: cloneConfig(),
  submissions: [],
};

let chain: Promise<unknown> = Promise.resolve();

function exclusive<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function localPath() {
  return process.env.EPP_FUEL_STORE_PATH ?? path.join("/tmp", "epp-fuel-judge.json");
}

async function readRaw(): Promise<FuelJudgeState | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text()) as FuelJudgeState;
  }
  try {
    return JSON.parse(await readFile(localPath(), "utf8")) as FuelJudgeState;
  } catch {
    return null;
  }
}

async function writeRaw(state: FuelJudgeState) {
  const body = JSON.stringify(state);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_PATH, body, {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return;
  }
  const file = localPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

function hydrate(raw: FuelJudgeState | null): FuelJudgeState {
  if (!raw?.config) {
    return { config: cloneConfig(), submissions: [] };
  }
  try {
    return {
      config: sanitizeConfig(raw.config),
      submissions: Array.isArray(raw.submissions) ? raw.submissions.map((row) => ({ ...row })) : [],
    };
  } catch {
    return { config: cloneConfig(), submissions: [] };
  }
}

/** Sync helpers used by unit tests and by service after a load. */
export function getFuelConfig() {
  return cloneConfig(memory.config);
}

export function resetFuelJudgeState() {
  memory = { config: cloneConfig(), submissions: [] };
}

export function listStoredSubmissions() {
  return memory.submissions.map((row) => ({ ...row }));
}

export function rememberSubmission(record: Record<string, unknown>) {
  memory.submissions.push({ ...record });
  return `local-${memory.submissions.length}`;
}

export function saveFuelConfig(next: FuelJudgeConfig): FuelJudgeConfig {
  const cleaned = sanitizeConfig(next);
  memory.config = cleaned;
  return cloneConfig(memory.config);
}

export function activeStage(current = memory.config): FuelStageConfig {
  return current.stages.find((stage) => stage.id === current.activeStageId) || current.stages[0];
}

export async function loadFuelJudgeState(): Promise<FuelJudgeState> {
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    return {
      config: cloneConfig(memory.config),
      submissions: memory.submissions.map((row) => ({ ...row })),
    };
  });
}

export async function persistFuelConfig(next: FuelJudgeConfig): Promise<FuelJudgeConfig> {
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    const cleaned = sanitizeConfig(next);
    memory.config = cleaned;
    await writeRaw({
      config: memory.config,
      submissions: memory.submissions,
    });
    return cloneConfig(memory.config);
  });
}

export async function persistSubmission(record: Record<string, unknown>): Promise<string> {
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    memory.submissions.push({ ...record });
    await writeRaw({
      config: memory.config,
      submissions: memory.submissions,
    });
    return `local-${memory.submissions.length}`;
  });
}

function sanitizeConfig(input: FuelJudgeConfig): FuelJudgeConfig {
  const stages = (input.stages || [])
    .map((stage) => {
      const form = stage.form === "pitch" ? "pitch" : "written";
      const columns = (stage.columns || []).filter((column) =>
        (FUEL_COLUMNS as readonly string[]).includes(column),
      );
      const statuses = (stage.statuses || []).filter((status) =>
        (FUEL_STATUSES as readonly string[]).includes(status),
      );
      const pipelines = (stage.pipelines || []).filter((pipeline) =>
        (FUEL_PIPELINES as readonly string[]).includes(pipeline),
      );
      return {
        id: String(stage.id || "").trim(),
        name: String(stage.name || "").trim(),
        form,
        columns,
        statuses,
        pipelines,
      } satisfies FuelStageConfig;
    })
    .filter(
      (stage) =>
        stage.id && stage.name && stage.statuses.length && stage.pipelines.length && stage.columns.length,
    );
  if (!stages.length) {
    throw new Error("Keep at least one stage with a status, a pipeline, and a column.");
  }
  const activeStageId = stages.some((stage) => stage.id === input.activeStageId)
    ? input.activeStageId
    : stages[0].id;
  return { activeStageId, stages };
}
