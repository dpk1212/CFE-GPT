"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeskAccount } from "@/components/AdminDesk";
import type { FuelAuditEntry } from "@/lib/fuelAdmin/store";
import {
  awaitingFeedback,
  awardedCount,
  bottleneck,
  formatMoney,
  fundingSum,
  inReviewCount,
  missingRequired,
  orderedStages,
  pipelineBreakdown,
  pipelineChipClass,
  pipelineLabel,
  reviewTotals,
  staleApplications,
  stageSlug,
  storedCounts,
  AWARDED_DOLLARS_REASON,
  DAYS_IN_STAGE_REASON,
  completeness,
  documentChecklist,
  IN_REVIEW_STAGES,
} from "@/lib/fuelAdmin/metrics";
import type { FuelDeskReview } from "@/lib/fuelAdmin/reviews";
import type { FuelApplication } from "@/lib/fuelJudge/types";
import { auditResult, moneyCompact, whenEt } from "./adminFormat";
import { stageTone } from "./stageTone";

type BoardPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  applications: FuelApplication[];
  audit: FuelAuditEntry[];
  truncated?: boolean;
  omitted?: number;
  syncing?: boolean;
};

type InsightsPayload = {
  applications?: {
    id: string;
    completeness: { present: number; required: number; missing: string[] };
    feedback: { crmCount: number | null; deskCount: number; notes: string[]; reviews: FuelDeskReview[] };
    daysSinceLastEdit: number | null;
  }[];
  funding?: {
    requested: number;
    awarded: null;
    awardedReason: string;
    byStage: { stage: string; count: number; requested: number }[];
    byPipeline: { pipeline: string; count: number; funding: number }[];
  };
  daysInStageReason?: string;
  feedbackWarning?: string;
  truncated?: boolean;
  omitted?: number;
};

export function ControlCenter({
  accounts,
  board,
  loading,
  loadError,
  onRetry,
  onOpen,
}: {
  accounts: DeskAccount[];
  board: BoardPayload | null;
  loading: boolean;
  loadError: string;
  onRetry: () => void;
  onOpen: (section: "pipeline" | "judges" | "activity", filters?: { stage?: string; pipeline?: string }) => void;
}) {
  const [insights, setInsights] = useState<InsightsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/fuel-insights")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as InsightsPayload | null;
        if (!cancelled && response.ok && body) setInsights(body);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [board?.applications.length, board?.mode]);

  const applications = board?.applications ?? [];
  const deskReviews = useMemo(() => {
    const fromInsights = insights?.applications?.flatMap((row) => row.feedback.reviews) ?? [];
    return fromInsights;
  }, [insights]);
  const counts = useMemo(() => storedCounts(deskReviews), [deskReviews]);

  const funnel = useMemo(() => {
    const byStage = new Map<string, { stage: string; count: number; requested: number }>();
    for (const item of insights?.funding?.byStage ?? []) {
      byStage.set(item.stage, { ...item });
    }
    if (!insights?.funding?.byStage?.length) {
      for (const app of applications) {
        const current = byStage.get(app.stage) ?? { stage: app.stage, count: 0, requested: 0 };
        current.count += 1;
        current.requested += app.fundingRequested ?? 0;
        byStage.set(app.stage, current);
      }
    }
    return orderedStages(byStage.keys())
      .map((stage) => byStage.get(stage))
      .filter((item): item is { stage: string; count: number; requested: number } => Boolean(item && item.count > 0));
  }, [applications, insights]);

  const pipelines = useMemo(() => {
    const rows = insights?.funding?.byPipeline ?? pipelineBreakdown(applications);
    return rows.filter((item) => item.count > 0);
  }, [applications, insights]);

  const pendingJudges = accounts.filter((account) => account.role === "judge" && account.status === "pending").length;
  const fundingRequested = insights?.funding?.requested ?? fundingSum(applications).sum;
  const awarded = awardedCount(applications);
  const inReview = inReviewCount(applications);
  const judgeReviews = reviewTotals(applications).sum + deskReviews.length;
  const topBottleneck = bottleneck(applications);
  const missingDocs = applications.filter(missingRequired).slice(0, 5);
  const noFeedback = awaitingFeedback(applications, counts).slice(0, 5);
  const stale = staleApplications(applications, 5);
  const maxFunnel = Math.max(1, ...funnel.map((item) => item.count));
  const omitted = board?.omitted ?? insights?.omitted ?? 0;
  const truncated = Boolean(board?.truncated || insights?.truncated);

  if (loading && !board) {
    return (
      <div className="cc-skeleton" aria-busy="true" aria-label="Loading control center">
        <div className="cc-kpi-strip">
          {Array.from({ length: 5 }).map((_, index) => <div key={index} className="cc-kpi is-skeleton" />)}
        </div>
        <div className="cc-grid">
          <div className="cc-card is-skeleton tall" />
          <div className="cc-card is-skeleton tall" />
        </div>
      </div>
    );
  }

  if (loadError && !board) {
    return (
      <div className="cc-empty">
        <p className="form-note" role="alert">{loadError}</p>
        <button className="btn" type="button" onClick={onRetry}>Try again</button>
      </div>
    );
  }

  const kpis = [
    {
      id: "apps",
      label: "Applications",
      value: String(applications.length),
      hint: truncated || omitted
        ? `${omitted ? `${omitted} unnamed omitted` : "Paged CRM read"}`
        : board?.mode === "mock"
          ? "Sample desk"
          : "Named Fuel deals",
      accent: "primary" as const,
      onClick: () => onOpen("pipeline"),
    },
    {
      id: "funding",
      label: "Funding requested",
      value: moneyCompact(fundingRequested),
      hint: "Sum of requested amounts",
      accent: "navy" as const,
      onClick: () => onOpen("pipeline"),
    },
    {
      id: "awarded",
      label: "Awarded",
      value: String(awarded),
      hint: "Count in award stages · no $ field",
      accent: awarded > 0 ? ("good" as const) : ("muted" as const),
      onClick: () => onOpen("pipeline", { stage: "Funding Awarded" }),
    },
    {
      id: "review",
      label: "In review",
      value: String(inReview),
      hint: "Active review stages",
      accent: inReview > 0 ? ("warn" as const) : ("muted" as const),
      onClick: () => onOpen("pipeline", { stage: "Out For Initial Review" }),
    },
    {
      id: "reviews",
      label: "Judge reviews",
      value: String(judgeReviews),
      hint: "CRM counts + desk dry-runs",
      accent: "maize" as const,
      onClick: () => onOpen("pipeline"),
    },
  ];

  return (
    <div className="control-center">
      <p className="console-lead">
        Overall control center for CFE program staff.
        {board?.mode === "mock"
          ? " Showing sample applications for design review."
          : board?.writesEnabled
            ? " Confirmed field edits write to Fuel CRM. Judge reviews stay dry-run."
            : " Field edits stay on this desk until admin writes are on. Judge reviews stay dry-run."}
      </p>

      <section className="cc-kpi-strip" aria-label="Key metrics">
        {kpis.map((kpi) => (
          <button key={kpi.id} type="button" className={`cc-kpi accent-${kpi.accent}`} onClick={kpi.onClick}>
            <span className="cc-kpi-label">{kpi.label}</span>
            <strong className="cc-kpi-value">{kpi.value}</strong>
            <span className="cc-kpi-hint">{kpi.hint}</span>
          </button>
        ))}
      </section>

      <div className="cc-grid">
        <section className="cc-card cc-funnel" aria-labelledby="cc-funnel-title">
          <header className="cc-card-head">
            <div>
              <p className="cc-eyebrow">Pipeline</p>
              <h2 id="cc-funnel-title">Stage funnel</h2>
            </div>
            <button type="button" className="cc-text-link" onClick={() => onOpen("pipeline")}>
              Open pipeline
            </button>
          </header>
          {funnel.length === 0 ? (
            <p className="quiet">No applications are in the Fuel pipelines.</p>
          ) : (
            <ul className="cc-funnel-list">
              {funnel.map((item) => (
                <li key={item.stage}>
                  <button type="button" onClick={() => onOpen("pipeline", { stage: item.stage })}>
                    <span className="cc-funnel-meta">
                      <span className={`stage-chip tone-${stageTone(item.stage)}`} data-stage={stageSlug(item.stage)}>
                        {item.stage}
                      </span>
                      <span className="cc-funnel-count">
                        <strong>{item.count}</strong>
                        <em>{moneyCompact(item.requested)}</em>
                      </span>
                    </span>
                    <span className="cc-funnel-track" aria-hidden="true">
                      <span style={{ width: `${Math.max(8, (item.count / maxFunnel) * 100)}%` }} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cc-card cc-attention" aria-labelledby="cc-attention-title">
          <header className="cc-card-head">
            <div>
              <p className="cc-eyebrow">Action</p>
              <h2 id="cc-attention-title">Needs attention</h2>
            </div>
            {pendingJudges > 0 ? (
              <button type="button" className="cc-pill" onClick={() => onOpen("judges")}>
                {pendingJudges} judge{pendingJudges === 1 ? "" : "s"} waiting
              </button>
            ) : null}
          </header>
          <ul className="cc-attention-list">
            {topBottleneck ? (
              <li>
                <button type="button" onClick={() => onOpen("pipeline", { stage: topBottleneck.stage })}>
                  <span className="cc-attention-kind kind-bottleneck">Bottleneck</span>
                  <strong>{topBottleneck.stage}</strong>
                  <span>{topBottleneck.count} application{topBottleneck.count === 1 ? "" : "s"} waiting in this stage.</span>
                </button>
              </li>
            ) : null}
            {missingDocs.map((app) => {
              const missing = documentChecklist(app).filter((doc) => doc.required && !doc.url).map((doc) => doc.label);
              return (
                <li key={`docs-${app.id}`}>
                  <button type="button" onClick={() => onOpen("pipeline", { stage: app.stage, pipeline: app.pipeline })}>
                    <span className="cc-attention-kind kind-missing-docs">Documents</span>
                    <strong>{app.projectName}</strong>
                    <span>Missing required: {missing.join(", ") || "incomplete"} ({completeness(app).present}/{completeness(app).required}).</span>
                  </button>
                </li>
              );
            })}
            {noFeedback.map((app) => (
              <li key={`fb-${app.id}`}>
                <button type="button" onClick={() => onOpen("pipeline", { stage: app.stage, pipeline: app.pipeline })}>
                  <span className="cc-attention-kind kind-no-feedback">No feedback</span>
                  <strong>{app.projectName}</strong>
                  <span>Out for review with no CRM count, dry-run reviews, or notes.</span>
                </button>
              </li>
            ))}
            {stale.map(({ application, at }) => (
              <li key={`stale-${application.id}`}>
                <button type="button" onClick={() => onOpen("pipeline", { stage: application.stage, pipeline: application.pipeline })}>
                  <span className="cc-attention-kind kind-stale">Last updated</span>
                  <strong>{application.projectName}</strong>
                  <span>
                    Last updated {Math.max(0, Math.floor((Date.now() - at) / 86_400_000))} days ago · {application.stage}.
                  </span>
                </button>
              </li>
            ))}
            {!topBottleneck && missingDocs.length === 0 && noFeedback.length === 0 && stale.length === 0 ? (
              <li><p className="quiet">Nothing is flagged right now.</p></li>
            ) : null}
          </ul>
        </section>

        <section className="cc-card" aria-labelledby="cc-pipelines-title">
          <header className="cc-card-head">
            <div>
              <p className="cc-eyebrow">Programs</p>
              <h2 id="cc-pipelines-title">By pipeline</h2>
            </div>
          </header>
          <ul className="cc-pipeline-breakdown">
            {pipelines.map((item) => (
              <li key={item.pipeline}>
                <button type="button" onClick={() => onOpen("pipeline", { pipeline: item.pipeline })}>
                  <span className={pipelineChipClass(item.pipeline)}>{pipelineLabel(item.pipeline)}</span>
                  <strong>{item.count}</strong>
                  <span>{formatMoney(item.funding)}</span>
                  <em>
                    {applications.filter((app) => app.pipeline === item.pipeline && (IN_REVIEW_STAGES as readonly string[]).includes(app.stage)).length} in review
                  </em>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="cc-card" aria-labelledby="cc-activity-title">
          <header className="cc-card-head">
            <div>
              <p className="cc-eyebrow">Desk</p>
              <h2 id="cc-activity-title">Recent activity</h2>
            </div>
            <button type="button" className="cc-text-link" onClick={() => onOpen("activity")}>
              Full log
            </button>
          </header>
          {(board?.audit.length ?? 0) === 0 ? (
            <p className="quiet">No field changes have been recorded.</p>
          ) : (
            <ul className="cc-activity-list">
              {board?.audit.slice(0, 5).map((entry) => (
                <li key={entry.id}>
                  <button type="button" onClick={() => onOpen("activity")}>
                    <strong>{entry.projectName}</strong>
                    <span>{entry.changes.map((change) => change.label).join(", ")}</span>
                    <em>{whenEt(entry.at)} ET · {auditResult(entry, "short")}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="cc-footnote quiet">
        Average days in stage is omitted ({insights?.daysInStageReason || DAYS_IN_STAGE_REASON}) Use Last updated from Modified_Time instead.
        Awarded dollars are omitted ({insights?.funding?.awardedReason || AWARDED_DOLLARS_REASON}) The Awarded KPI is a stage count.
        {truncated || omitted ? ` Pipeline read: ${applications.length} named deals${omitted ? `, ${omitted} omitted for blank names` : ""}.` : ""}
        {insights?.feedbackWarning ? ` · ${insights.feedbackWarning}` : ""}
      </p>
    </div>
  );
}
