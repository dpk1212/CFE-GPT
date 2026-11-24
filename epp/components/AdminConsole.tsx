"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAccounts } from "@/components/AdminDesk";
import { FuelConfigPanel } from "@/components/FuelConfigPanel";
import { PipelineBoard } from "@/components/PipelineBoard";
import type { FuelAuditEntry } from "@/lib/fuelAdmin/store";
import type { DeskAccount } from "@/components/AdminDesk";
import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

type BoardPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  applications: FuelApplication[];
  audit: FuelAuditEntry[];
  syncing?: boolean;
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "judges", label: "Judges" },
  { id: "desk", label: "Desk setup" },
  { id: "admins", label: "Admins" },
  { id: "activity", label: "Activity" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function isSection(value: string | null): value is SectionId {
  return SECTIONS.some((section) => section.id === value);
}

export function AdminConsole({ accounts }: { accounts: DeskAccount[] }) {
  return (
    <Suspense fallback={<p className="console-status">Loading the admin console.</p>}>
      <AdminConsoleInner accounts={accounts} />
    </Suspense>
  );
}

function AdminConsoleInner({ accounts }: { accounts: DeskAccount[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("section");
  const section: SectionId = isSection(requested) ? requested : "overview";
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  function load() {
    setLoadError("");
    return fetch("/api/admin/fuel-pipeline")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (BoardPayload & { error?: string }) | null;
        if (!response.ok || !body?.applications) {
          setLoadError(body?.error ?? "The Fuel pipeline could not be loaded.");
          setBoard(null);
          return;
        }
        setBoard(body);
      })
      .catch(() => setLoadError("The Fuel pipeline could not be loaded."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/fuel-pipeline")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (BoardPayload & { error?: string }) | null;
        if (cancelled) return;
        if (!response.ok || !body?.applications) {
          setLoadError(body?.error ?? "The Fuel pipeline could not be loaded.");
          return;
        }
        setBoard(body);
      })
      .catch(() => {
        if (!cancelled) setLoadError("The Fuel pipeline could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function go(next: { section?: SectionId; stage?: string | null; pipeline?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next.section ?? section);
    if ("stage" in next) {
      if (!next.stage || next.stage === "All") params.delete("stage");
      else params.set("stage", next.stage);
    }
    if ("pipeline" in next) {
      if (!next.pipeline || next.pipeline === "All") params.delete("pipeline");
      else params.set("pipeline", next.pipeline);
    }
    if ((next.section ?? section) !== "pipeline") {
      params.delete("stage");
      params.delete("pipeline");
    }
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }

  const pending = accounts.filter((account) => account.status === "pending" && account.role === "judge").length;
  const current = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  return (
    <div className="admin-console">
      <nav className="admin-nav" aria-label="Admin sections">
        <p className="admin-nav-kicker">Admin</p>
        {SECTIONS.map((item) => (
          <a
            key={item.id}
            href={`/admin?section=${item.id}`}
            aria-current={item.id === section ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              go({ section: item.id });
            }}
          >
            {item.label}
            {item.id === "judges" && pending > 0 ? <span className="nav-badge">{pending}</span> : null}
          </a>
        ))}
        <Link className="admin-nav-judge" href="/judge">View as judge</Link>
      </nav>
      <div className="admin-main" data-section={section}>
        <header className="console-head">
          <p className="eyebrow">Entrepreneurial Practice Programs</p>
          <h1>{current.label}</h1>
        </header>
        {board?.syncing ? <p className="console-status">CRM syncing</p> : null}
        {section === "overview" ? (
          <Overview
            accounts={accounts}
            board={board}
            loading={loading}
            loadError={loadError}
            onRetry={() => void load()}
            onOpen={(target, filters) => go({ section: target, stage: filters?.stage ?? null, pipeline: filters?.pipeline ?? null })}
          />
        ) : null}
        {section === "pipeline" ? (
          <PipelineBoard
            board={board}
            loading={loading}
            loadError={loadError}
            onReload={load}
            stage={searchParams.get("stage") || "All"}
            pipeline={searchParams.get("pipeline") || "All"}
            onStage={(stage) => go({ section: "pipeline", stage })}
            onPipeline={(pipeline) => go({ section: "pipeline", pipeline })}
          />
        ) : null}
        {section === "judges" ? <AdminAccounts accounts={accounts} view="judges" /> : null}
        {section === "desk" ? <FuelConfigPanel applications={board?.applications ?? []} /> : null}
        {section === "admins" ? <AdminAccounts accounts={accounts} view="admins" /> : null}
        {section === "activity" ? <Activity audit={board?.audit ?? []} loading={loading} loadError={loadError} onRetry={() => void load()} /> : null}
      </div>
    </div>
  );
}

function Overview({
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
  onOpen: (section: SectionId, filters?: { stage?: string; pipeline?: string }) => void;
}) {
  const pending = accounts.filter((account) => account.role === "judge" && account.status === "pending");
  const judges = accounts.filter((account) => account.role === "judge" && account.status === "approved");
  const stageCounts = useMemo(() => {
    const applications = board?.applications ?? [];
    return FUEL_STATUSES.map((stage) => ({
      stage,
      count: applications.filter((application) => application.stage === stage).length,
    }));
  }, [board]);
  const pipelineCounts = useMemo(() => {
    const applications = board?.applications ?? [];
    return FUEL_PIPELINES.map((pipeline) => ({
      pipeline,
      count: applications.filter((application) => application.pipeline === pipeline).length,
    }));
  }, [board]);

  if (loading && !board) return <p className="console-status">Loading the Fuel pipeline.</p>;
  if (loadError && !board) {
    return (
      <div>
        <p className="form-note" role="alert">{loadError}</p>
        <button className="btn" type="button" onClick={onRetry}>Try again</button>
      </div>
    );
  }

  return (
    <div className="overview">
      <p className="console-lead">
        {board?.applications.length ?? 0} Fuel application{(board?.applications.length ?? 0) === 1 ? "" : "s"}.
        {board?.mode === "mock"
          ? " These are sample applications."
          : board?.writesEnabled
            ? " Confirmed field edits are written to Fuel CRM. Judge reviews are not."
            : " Field edits stay on this desk until admin writes are turned on. Judge reviews are not written to Fuel CRM."}
      </p>
      <div className="overview-stats">
        <button type="button" onClick={() => onOpen("pipeline")}>
          <span>Applications</span>
          <strong>{board?.applications.length ?? 0}</strong>
        </button>
        <button type="button" onClick={() => onOpen("judges")}>
          <span>Waiting</span>
          <strong>{pending.length}</strong>
        </button>
        <button type="button" onClick={() => onOpen("judges")}>
          <span>Approved judges</span>
          <strong>{judges.length}</strong>
        </button>
        <button type="button" onClick={() => onOpen("activity")}>
          <span>Recorded edits</span>
          <strong>{board?.audit.length ?? 0}</strong>
        </button>
      </div>
      <div className="overview-split">
        <section>
          <h2>By stage</h2>
          <ul>
            {stageCounts.map((item) => (
              <li key={item.stage}>
                <button type="button" onClick={() => onOpen("pipeline", { stage: item.stage })}>
                  <span>{item.stage}</span>
                  <strong>{item.count}</strong>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>By pipeline</h2>
          <ul>
            {pipelineCounts.map((item) => (
              <li key={item.pipeline}>
                <button type="button" onClick={() => onOpen("pipeline", { pipeline: item.pipeline })}>
                  <span>{item.pipeline}</span>
                  <strong>{item.count}</strong>
                </button>
              </li>
            ))}
          </ul>
          <h2>Latest edits</h2>
          {(board?.audit.length ?? 0) === 0 ? <p className="quiet">No field changes have been recorded.</p> : (
            <ul className="overview-edits">
              {board?.audit.slice(0, 4).map((entry) => (
                <li key={entry.id}>
                  <button type="button" onClick={() => onOpen("activity")}>
                    <strong>{entry.projectName}</strong>
                    <span>{entry.changes.map((change) => change.label).join(", ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Activity({
  audit,
  loading,
  loadError,
  onRetry,
}: {
  audit: FuelAuditEntry[];
  loading: boolean;
  loadError: string;
  onRetry: () => void;
}) {
  if (loading && audit.length === 0 && !loadError) return <p className="console-status">Loading the audit log.</p>;
  if (loadError) {
    return (
      <div>
        <p className="form-note" role="alert">{loadError}</p>
        <button className="btn" type="button" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (audit.length === 0) return <p className="console-status">No field changes have been recorded.</p>;
  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Who</th>
            <th scope="col">Project</th>
            <th scope="col">Change</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {audit.map((entry) => (
            <tr key={entry.id}>
              <td>{new Date(entry.at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET</td>
              <td>{entry.email}</td>
              <td>{entry.projectName}</td>
              <td>
                {entry.changes.map((change) => (
                  <span key={`${entry.id}-${change.field}`} className="audit-change">{change.label}: {change.old || "—"} → {change.new || "—"}</span>
                ))}
              </td>
              <td>{entry.wrote ? "Written to Fuel CRM" : "Dry run"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
