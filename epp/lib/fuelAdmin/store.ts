import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EditableDeal } from "./fields";

const BLOB_PATH = "epp/fuel-admin.json";
const AUDIT_LIMIT = 200;

export type FuelAuditEntry = {
  id: string;
  at: string;
  email: string;
  applicationId: string;
  projectName: string;
  pipeline: string;
  wrote: boolean;
  changes: { field: string; label: string; old: string; new: string }[];
};

type AdminState = {
  audit: FuelAuditEntry[];
  overlays: Record<string, EditableDeal>;
  /** Empty means the default Fuel stage order. Shared by every admin. */
  stageOrder: string[];
};

let memory: AdminState = { audit: [], overlays: {}, stageOrder: [] };
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
  return process.env.EPP_FUEL_ADMIN_STORE_PATH ?? path.join("/tmp", "epp-fuel-admin.json");
}

function empty(): AdminState {
  return { audit: [], overlays: {}, stageOrder: [] };
}

export function resetFuelAdminState() {
  memory = empty();
}

async function readRaw(): Promise<AdminState | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text()) as AdminState;
  }
  try {
    return JSON.parse(await readFile(localPath(), "utf8")) as AdminState;
  } catch {
    return null;
  }
}

async function writeRaw(state: AdminState) {
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

function hydrate(raw: AdminState | null): AdminState {
  if (!raw) return empty();
  return {
    audit: Array.isArray(raw.audit) ? raw.audit.slice(-AUDIT_LIMIT) : [],
    overlays: raw.overlays && typeof raw.overlays === "object" ? raw.overlays : {},
    stageOrder: cleanStageOrder(raw.stageOrder),
  };
}

function cleanStageOrder(value: unknown) {
  if (!Array.isArray(value)) return [];
  const order: string[] = [];
  for (const stage of value) {
    if (typeof stage !== "string") continue;
    const name = stage.trim();
    if (!name || name.length > 80 || order.includes(name)) continue;
    order.push(name);
    if (order.length >= 40) break;
  }
  return order;
}

export function getFuelAdminState() {
  return {
    audit: memory.audit.map((entry) => ({ ...entry, changes: entry.changes.map((change) => ({ ...change })) })),
    overlays: { ...memory.overlays },
    stageOrder: [...memory.stageOrder],
  };
}

export async function loadFuelAdminState(options?: { durable?: boolean }) {
  if (options?.durable === false) return getFuelAdminState();
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    return getFuelAdminState();
  });
}

export async function recordFuelAdminChange(
  entry: FuelAuditEntry,
  overlay: { id: string; fields: EditableDeal } | null,
  options?: { durable?: boolean },
) {
  const apply = () => {
    memory.audit = [...memory.audit, entry].slice(-AUDIT_LIMIT);
    if (overlay) memory.overlays = { ...memory.overlays, [overlay.id]: overlay.fields };
    return getFuelAdminState();
  };
  if (options?.durable === false) return apply();
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    apply();
    await writeRaw(memory);
    return getFuelAdminState();
  });
}

export async function saveFuelStageOrder(stageOrder: string[], options?: { durable?: boolean }) {
  const next = cleanStageOrder(stageOrder);
  const apply = () => {
    memory.stageOrder = next;
    return getFuelAdminState();
  };
  if (options?.durable === false) return apply();
  return exclusive(async () => {
    memory = hydrate(await readRaw());
    apply();
    await writeRaw(memory);
    return getFuelAdminState();
  });
}
