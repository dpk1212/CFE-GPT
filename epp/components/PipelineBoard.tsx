"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PIPELINE_VIEW_KEY, money, pipelineShort, shown } from "@/components/admin/adminFormat";
import { EDITABLE_FIELDS, readEditable, type EditableDeal } from "@/lib/fuelAdmin/fields";
import {
  completeness,
  feedbackBadge,
  formatMoney,
  fundingSum,
  pipelineLabel,
  stageSlug,
} from "@/lib/fuelAdmin/metrics";
import type { FuelAuditEntry } from "@/lib/fuelAdmin/store";
import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

type BoardPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  applications: FuelApplication[];
  audit: FuelAuditEntry[];
  truncated?: boolean;
};

type ChangeRow = { label: string; old: string; new: string };
type ViewMode = "board" | "table";
type SortKey = "projectName" | "pipeline" | "stage" | "fundingRequested" | "completeness" | "feedback";

const GROUPS = [
  { id: "basics", title: "Basics", keys: ["projectName", "stage", "pipeline", "summary", "industries"] },
  { id: "funding", title: "Funding", keys: ["fundingRequested"] },
  { id: "documents", title: "Documents", keys: EDITABLE_FIELDS.filter((field) => field.kind === "url").map((field) => field.key) },
] as const;

function stageTone(stage: string) {
  if (stage === "Needs Completeness Check" || stage === "Student Revision Needed") return "warn";
  if (
    stage === "Ready For Initial Review" ||
    stage === "Out For Initial Review" ||
    stage === "Out For Funding Decision" ||
    stage === "Initial Feedback Returned" ||
    stage === "Invited For Presentation"
  ) {
    return "active";
  }
  if (stage === "Funding Awarded") return "good";
  if (stage === "Not Invited To Present" || stage === "No Funding") return "bad";
  return "neutral";
}

export function PipelineBoard({
  board,
  loading,
  loadError,
  onReload,
  stage,
  pipeline,
  onStage,
  onPipeline,
}: {
  board: BoardPayload | null;
  loading: boolean;
  loadError: string;
  onReload: () => Promise<void> | void;
  stage: string;
  pipeline: string;
  onStage: (stage: string) => void;
  onPipeline: (pipeline: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("board");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "projectName", dir: "asc" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableDeal | null>(null);
  const [pending, setPending] = useState<ChangeRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PIPELINE_VIEW_KEY);
      if (saved === "board" || saved === "table") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function chooseView(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(PIPELINE_VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const rows = useMemo(() => {
    const applications = board?.applications ?? [];
    const needle = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (pipeline !== "All" && application.pipeline !== pipeline) return false;
      if (stage !== "All" && application.stage !== stage) return false;
      if (!needle) return true;
      return [application.projectName, application.summary, application.industries, application.stage, application.pipeline]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [board, pipeline, query, stage]);

  const columns = useMemo(() => {
    const order = [...FUEL_STATUSES];
    for (const row of rows) {
      if (!order.includes(row.stage as (typeof FUEL_STATUSES)[number])) {
        order.push(row.stage as (typeof FUEL_STATUSES)[number]);
      }
    }
    return order
      .map((name) => {
        const apps = rows.filter((row) => row.stage === name);
        return { stage: name, rows: apps, funding: fundingSum(apps).sum };
      })
      .filter((group) => group.rows.length);
  }, [rows]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "fundingRequested") return ((a.fundingRequested ?? -1) - (b.fundingRequested ?? -1)) * dir;
      if (sort.key === "completeness") {
        return (completeness(a).present - completeness(b).present) * dir;
      }
      if (sort.key === "feedback") {
        return ((feedbackBadge(a, 0) ?? -1) - (feedbackBadge(b, 0) ?? -1)) * dir;
      }
      return String(a[sort.key]).localeCompare(String(b[sort.key])) * dir;
    });
    return copy;
  }, [rows, sort]);

  const selected = board?.applications.find((row) => row.id === selectedId) ?? null;

  function openApplication(application: FuelApplication) {
    setSelectedId(application.id);
    setDraft(readEditable(application));
    setMessage("");
    setError("");
    setPreview(null);
  }

  function closeDrawer() {
    setSelectedId(null);
    setDraft(null);
  }

  function changesFromDraft() {
    if (!selected || !draft) return [];
    const current = readEditable(selected);
    return EDITABLE_FIELDS.flatMap((field) => {
      const oldValue = shown(current[field.key]);
      const newValue = shown(draft[field.key]);
      if (oldValue === newValue) return [];
      return [{ label: field.label, old: oldValue, new: newValue }];
    });
  }

  function askConfirm() {
    const changes = changesFromDraft();
    if (!changes.length) {
      setError("No fields changed.");
      return;
    }
    setError("");
    setPending(changes);
    dialogRef.current?.showModal();
  }

  async function confirmSave() {
    if (!selected || !draft) return;
    dialogRef.current?.close();
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/fuel-pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: selected.id, fields: draft }),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      wrote?: boolean;
      application?: FuelApplication;
      request?: Record<string, unknown>;
    } | null;
    setBusy(false);
    if (!response.ok || !body?.application) {
      setError(body?.error ?? "The application was not updated.");
      return;
    }
    setPreview(body.wrote ? null : (body.request ?? null));
    setMessage(body.wrote ? `Saved ${body.application.projectName} in Fuel CRM.` : `Dry run for ${body.application.projectName}. Fuel CRM was not updated.`);
    await onReload();
    setSelectedId(body.application.id);
    setDraft(readEditable(body.application));
  }

  function fieldControl(field: (typeof EDITABLE_FIELDS)[number]) {
    if (!draft) return null;
    if (field.kind === "stage") {
      return (
        <select value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}>
          {FUEL_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      );
    }
    if (field.kind === "pipeline") {
      return (
        <select value={draft.pipeline} onChange={(event) => setDraft({ ...draft, pipeline: event.target.value })}>
          {FUEL_PIPELINES.map((item) => <option key={item}>{item}</option>)}
        </select>
      );
    }
    if (field.kind === "money") {
      return (
        <input
          inputMode="numeric"
          value={draft.fundingRequested ?? ""}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") setDraft({ ...draft, fundingRequested: null });
            else if (/^\d+(\.\d+)?$/.test(raw)) setDraft({ ...draft, fundingRequested: Number(raw) });
          }}
        />
      );
    }
    if (field.kind === "url" || field.key === "summary") {
      return (
        <textarea
          rows={field.key === "summary" ? 3 : 2}
          value={(draft[field.key] as string | null) ?? ""}
          onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
        />
      );
    }
    return (
      <input
        value={String(draft[field.key] ?? "")}
        onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
      />
    );
  }

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }

  return (
    <section className="pipeline-board pipeline-elite" aria-labelledby="pipeline-heading">
      <p id="pipeline-heading" className="sr-only">Pipeline</p>
      {loading && !board ? (
        <div className="cc-skeleton" aria-busy="true">
          <div className="cc-card is-skeleton tall" />
        </div>
      ) : null}
      {loadError ? (
        <div>
          <p className="form-note" role="alert">{loadError}</p>
          <button className="btn" type="button" onClick={() => void onReload()}>Try again</button>
        </div>
      ) : null}
      {board ? (
        <>
          <p className="desk-note">
            {board.applications.length} application{board.applications.length === 1 ? "" : "s"}.
            {board.mode === "mock"
              ? " These are sample applications. Confirmed edits stay on this desk."
              : board.writesEnabled
                ? " Confirmed edits are written to Fuel CRM deals in the Fuel pipelines."
                : " Confirmed edits stay on this desk until Fuel admin writes are turned on."}
            {board.truncated ? " CRM results were paged; later deals may still be loading on refresh." : ""}
          </p>

          <div className="pipeline-toolbar">
            <div className="view-toggle" role="group" aria-label="Pipeline view">
              <button type="button" className={view === "board" ? "on" : undefined} aria-pressed={view === "board"} onClick={() => chooseView("board")}>
                Board
              </button>
              <button type="button" className={view === "table" ? "on" : undefined} aria-pressed={view === "table"} onClick={() => chooseView("table")}>
                Table
              </button>
            </div>
            <label className="desk-search">
              <span className="sr-only">Search applications</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search name, summary, or industry" />
            </label>
            <label>
              Pipeline
              <select value={pipeline} onChange={(event) => onPipeline(event.target.value)}>
                <option>All</option>
                {FUEL_PIPELINES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Stage
              <select value={stage} onChange={(event) => onStage(event.target.value)}>
                <option>All</option>
                {FUEL_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {board.applications.length === 0 ? <p className="desk-empty">No Fuel applications are on this desk.</p> : null}
          {board.applications.length > 0 && rows.length === 0 ? <p className="desk-empty">No applications match those filters.</p> : null}

          {view === "board" && rows.length > 0 ? (
            <div className="kanban-scroller">
              <div className="kanban-board">
                {columns.map((column) => (
                  <section key={column.stage} className="kanban-column">
                    <header>
                      <div>
                        <h3>
                          <span className={`stage-chip tone-${stageTone(column.stage)}`} data-stage={stageSlug(column.stage)}>
                            {column.stage}
                          </span>
                        </h3>
                        <p>
                          <strong>{column.rows.length}</strong>
                          <span>{formatMoney(column.funding)}</span>
                        </p>
                      </div>
                    </header>
                    <ul>
                      {column.rows.map((application) => {
                        const complete = completeness(application);
                        const feedback = feedbackBadge(application, 0);
                        return (
                          <li key={application.id}>
                            <button
                              type="button"
                              className={`kanban-card${application.id === selectedId ? " is-selected" : ""}`}
                              onClick={() => openApplication(application)}
                            >
                              <strong>{application.projectName}</strong>
                              <span className="pipeline-chip">{pipelineLabel(application.pipeline)}</span>
                              <span className="kanban-funding">{money(application.fundingRequested)}</span>
                              <span className="meter" aria-label={`${complete.present} of ${complete.required} required documents`}>
                                <span style={{ width: `${(complete.present / complete.required) * 100}%` }} />
                                <em>{complete.present}/{complete.required} docs</em>
                              </span>
                              <span className={`feedback-badge${feedback ? "" : " is-empty"}`}>
                                {feedback == null ? "No reviews" : `${feedback} review${feedback === 1 ? "" : "s"}`}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {view === "table" && rows.length > 0 ? (
            <div className="pipeline-table-wrap">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("projectName")}>Project</button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("pipeline")}>Pipeline</button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("stage")}>Stage</button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("fundingRequested")}>Funding</button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("completeness")}>Docs</button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("feedback")}>Feedback</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((application) => {
                    const complete = completeness(application);
                    const feedback = feedbackBadge(application, 0);
                    return (
                      <tr key={application.id} className={application.id === selectedId ? "is-selected" : undefined}>
                        <th scope="row">
                          <button type="button" className="desk-name" onClick={() => openApplication(application)}>
                            {application.projectName}
                          </button>
                          {application.summary ? <span className="desk-summary">{application.summary}</span> : null}
                        </th>
                        <td><span className="pipeline-chip">{pipelineShort(application.pipeline)}</span></td>
                        <td><span className={`stage-chip tone-${stageTone(application.stage)}`}>{application.stage}</span></td>
                        <td>{money(application.fundingRequested)}</td>
                        <td>
                          <span className="meter compact" aria-label={`${complete.present} of ${complete.required} required documents`}>
                            <span style={{ width: `${(complete.present / complete.required) * 100}%` }} />
                            <em>{complete.present}/{complete.required}</em>
                          </span>
                        </td>
                        <td>
                          <span className={`feedback-badge${feedback ? "" : " is-empty"}`}>
                            {feedback == null ? "—" : feedback}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {selected && draft ? (
            <div className="drawer-layer">
              <button className="drawer-scrim" type="button" aria-label="Close application" onClick={closeDrawer} />
              <aside className="pipeline-drawer" aria-label="Application detail">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    askConfirm();
                  }}
                >
                  <div className="read-head">
                    <h3>{selected.projectName}</h3>
                    <button className="btn-line" type="button" onClick={closeDrawer}>Close</button>
                  </div>
                  {GROUPS.map((group) => (
                    <fieldset key={group.id} className="drawer-group">
                      <legend>{group.title}</legend>
                      {EDITABLE_FIELDS.filter((field) => (group.keys as readonly string[]).includes(field.key)).map((field) => (
                        <label key={field.key}>
                          {field.label}
                          {fieldControl(field)}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Review change"}</button>
                  {error ? <p className="form-note" role="alert">{error}</p> : null}
                  {message ? <p className="form-note" role="status">{message}</p> : null}
                  {preview ? (
                    <details className="payload-preview" open>
                      <summary>Payload preview</summary>
                      <pre>{JSON.stringify(preview, null, 2)}</pre>
                    </details>
                  ) : null}
                </form>
              </aside>
            </div>
          ) : null}

          <dialog ref={dialogRef} className="confirm-dialog">
            <h3>Confirm this change</h3>
            <table className="desk-table">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Current</th>
                  <th scope="col">New</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((change) => (
                  <tr key={change.label}>
                    <th scope="row">{change.label}</th>
                    <td>{change.old}</td>
                    <td>{change.new}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="judge-form-actions">
              <button className="btn-line" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
              <button className="btn" type="button" onClick={() => void confirmSave()}>Confirm</button>
            </div>
          </dialog>
        </>
      ) : null}
    </section>
  );
}
