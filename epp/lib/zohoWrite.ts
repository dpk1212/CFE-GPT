/** Triggers Zoho runs for a record create or update. An empty array suppresses them. */
export const CRM_AUTOMATION_TRIGGERS = ["workflow", "blueprint", "approval"] as const;

export function crmWriteEnvelope(record: Record<string, unknown>) {
  return {
    data: [record],
    trigger: [...CRM_AUTOMATION_TRIGGERS],
  };
}

export function crmWriteRequest(
  method: "POST" | "PUT",
  path: string,
  record: Record<string, unknown>,
) {
  return {
    method,
    path,
    body: crmWriteEnvelope(record),
  };
}
