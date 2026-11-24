export function money(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function moneyCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function shown(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

export function auditResult(entry: { wrote: boolean; scope?: string }, style: "short" | "full" = "full") {
  if (entry.scope === "roster") return "Saved";
  if (entry.wrote) return style === "short" ? "Written" : "Written to Fuel CRM";
  return "Dry run";
}

export function whenEt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function pipelineShort(pipeline: string) {
  if (pipeline === "Fuel Consumer IT") return "Consumer IT";
  if (pipeline === "Fuel Jumpstart") return "Jumpstart";
  return pipeline;
}

export const PIPELINE_VIEW_KEY = "epp-admin-pipeline-view";
