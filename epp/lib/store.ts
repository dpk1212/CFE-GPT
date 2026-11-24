import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BOOTSTRAP_ADMIN_EMAIL, bootstrapAdmin, type Account } from "@/lib/accounts";
import { hashPassword } from "@/lib/password";

const BLOB_PATH = "epp/users.json";

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
  return process.env.EPP_STORE_PATH ?? path.join("/tmp", "epp-users.json");
}

async function readRaw(): Promise<Account[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(BLOB_PATH, { access: "private", useCache: false, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    return JSON.parse(await new Response(result.stream).text()) as Account[];
  }
  try {
    return JSON.parse(await readFile(localPath(), "utf8")) as Account[];
  } catch {
    return [];
  }
}

async function writeRaw(accounts: Account[]) {
  const body = JSON.stringify(accounts);
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

async function withSeed(accounts: Account[]) {
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password || accounts.some((account) => account.email === BOOTSTRAP_ADMIN_EMAIL)) return accounts;
  const next = bootstrapAdmin(accounts, hashPassword(password), new Date().toISOString());
  await writeRaw(next);
  return next;
}

export async function readAccounts() {
  return exclusive(async () => withSeed(await readRaw()));
}

export async function updateAccounts(change: (accounts: Account[]) => Account[] | Promise<Account[]>) {
  return exclusive(async () => {
    const current = await withSeed(await readRaw());
    const next = await change(current);
    await writeRaw(next);
    return next;
  });
}
