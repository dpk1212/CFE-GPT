export type CoqlPageResult = {
  ok: boolean;
  rows: Record<string, unknown>[];
  more: boolean;
  message: string;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 10;

export async function postCoql(token: string, domain: string, selectQuery: string): Promise<CoqlPageResult> {
  const response = await fetch(`${domain}/crm/v8/coql`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ select_query: selectQuery }),
  });
  if (response.status === 204) return { ok: true, rows: [], more: false, message: "" };
  const payload = (await response.json().catch(() => null)) as {
    data?: Record<string, unknown>[];
    info?: { more_records?: boolean };
    message?: string;
  } | null;
  if (!response.ok) {
    return { ok: false, rows: [], more: false, message: payload?.message || "Fuel CRM could not be read." };
  }
  return {
    ok: true,
    rows: payload?.data || [],
    more: Boolean(payload?.info?.more_records),
    message: "",
  };
}

/** Reads every COQL page. Zoho returns at most 200 rows and sets info.more_records. */
export async function collectCoqlPages(
  page: (query: string) => Promise<CoqlPageResult>,
  baseQuery: string,
): Promise<{ ok: true; rows: Record<string, unknown>[]; truncated: boolean } | { ok: false; message: string }> {
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < MAX_PAGES; index += 1) {
    const offset = index * PAGE_SIZE;
    const query =
      index === 0
        ? `${baseQuery} order by id asc limit ${PAGE_SIZE}`
        : `${baseQuery} order by id asc limit ${PAGE_SIZE} offset ${offset}`;
    const result = await page(query);
    if (!result.ok) return { ok: false, message: result.message };
    for (const row of result.rows) {
      const id = row.id == null ? "" : String(row.id).trim();
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      rows.push(row);
    }
    if (!result.more || result.rows.length === 0) return { ok: true, rows, truncated: false };
  }
  return { ok: true, rows, truncated: true };
}

export async function postCoqlAll(token: string, domain: string, baseQuery: string) {
  const paged = await collectCoqlPages((query) => postCoql(token, domain, query), baseQuery);
  if (paged.ok) return paged;
  const single = await postCoql(token, domain, `${baseQuery} limit ${PAGE_SIZE}`);
  if (!single.ok) return { ok: false as const, message: single.message || paged.message };
  return { ok: true as const, rows: single.rows, truncated: single.more };
}
