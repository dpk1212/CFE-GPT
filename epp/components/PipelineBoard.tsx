"use client";

import { useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { ApplicationReview } from "@/components/admin/ApplicationReview";
import { KanbanColumns, SortableStageColumn } from "@/components/admin/KanbanColumns";
import { MassStageMove } from "@/components/admin/MassStageMove";
import { PIPELINE_VIEW_KEY, money, pipelineShort } from "@/components/admin/adminFormat";
import { stageTone } from "@/components/admin/stageTone";
import type { EditableDeal } from "@/lib/fuelAdmin/fields";
import {
  completeness,
  feedbackBadge,
  formatMoney,
  fundingSum,
  mergeStageOrder,
  pipelineChipClass,
  stageColumnOrder,
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
  stageOrder?: string[];
  truncated?: boolean;
  omitted?: number;
};

type ViewMode = "board" | "table";
type SortKey = "projectName" | "pipeline" | "stage" | "fundingRequested" | "completeness" | "feedback";

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
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [stageOrder, setStageOrder] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    setStageOrder(board?.stageOrder ?? []);
  }, [board?.stageOrder]);

  const columns = useMemo(() => {
    return stageColumnOrder(rows.map((row) => row.stage), stageOrder)
      .map((name) => {
        const apps = rows.filter((row) => row.stage === name);
        return { stage: name, rows: apps, funding: fundingSum(apps).sum };
      })
      .filter((group) => group.rows.length);
  }, [rows, stageOrder]);

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

  const visibleIds = rows.map((row) => row.id).join("\u0000");
  useEffect(() => {
    const visible = new Set(visibleIds ? visibleIds.split("\u0000") : []);
    setPickedIds((current) => current.filter((id) => visible.has(id)));
  }, [visibleIds]);

  const selected = board?.applications.find((row) => row.id === selectedId) ?? null;

  function togglePicked(id: string) {
    setPickedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function setPicked(ids: string[], on: boolean) {
    setPickedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return [...next];
    });
  }

  function openApplication(application: FuelApplication) {
    setSelectedId(application.id);
    setMessage("");
    setError("");
    setPreview(null);
  }

  function closeDrawer() {
    setSelectedId(null);
  }

  async function saveDraft(draft: EditableDeal) {
    if (!selected) return;
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
  }

  async function moveStages(stage: string, ids: string[]) {
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/fuel-pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationIds: ids, stage }),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      updated?: { id: string; projectName: string }[];
      unchanged?: { id: string }[];
      failed?: { id: string; projectName: string; error: string }[];
    } | null;
    setBusy(false);
    if (!response.ok || !body || body.error) {
      setError(body?.error ?? "The stages were not updated.");
      return;
    }
    const failed = body.failed ?? [];
    const updated = body.updated ?? [];
    const unchanged = body.unchanged ?? [];
    const parts = [`Updated ${updated.length}.`];
    if (unchanged.length) parts.push(`${unchanged.length} already at ${stage}.`);
    if (failed.length) {
      parts.push(
        `Failed: ${failed.map((row) => `${row.projectName} (${row.error})`).join("; ")}.`,
      );
    }
    if (failed.length) setError(parts.join(" "));
    else setMessage(parts.join(" "));
    setPickedIds(failed.map((row) => row.id));
    await onReload();
  }

  async function persistOrder(visibleOrder: string[]) {
    const previous = stageOrder;
    setStageOrder(mergeStageOrder(previous, visibleOrder));
    setOrderNote("");
    const response = await fetch("/api/admin/fuel-pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stageOrder: visibleOrder }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; stageOrder?: string[] } | null;
    if (!response.ok || !body?.stageOrder) {
      setStageOrder(previous);
      setOrderNote(body?.error ?? "The column order was not saved.");
      return;
    }
    setStageOrder(body.stageOrder);
  }

  function reorderColumns(activeId: string, overId: string) {
    const visible = columns.map((column) => column.stage);
    const from = visible.indexOf(activeId);
    const to = visible.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    void persistOrder(arrayMove(visible, from, to));
  }

  async function resetOrder() {
    const previous = stageOrder;
    setStageOrder([]);
    setOrderNote("");
    const response = await fetch("/api/admin/fuel-pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resetStageOrder: true }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; stageOrder?: string[] } | null;
    if (!response.ok || !body) {
      setStageOrder(previous);
      setOrderNote(body?.error ?? "The column order was not reset.");
      return;
    }
    setStageOrder(body.stageOrder ?? []);
    setOrderNote("Column order reset for every admin.");
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
            {board.truncated || board.omitted
              ? ` ${board.applications.length} named deals${board.omitted ? `, ${board.omitted} omitted for blank names` : ""}.`
              : ""}
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

          <MassStageMove
            rows={rows}
            selectedIds={pickedIds}
            writesEnabled={board.writesEnabled}
            busy={busy}
            onChangeSelection={setPickedIds}
            onApply={moveStages}
          />

          {board.applications.length === 0 ? <p className="desk-empty">No Fuel applications are on this desk.</p> : null}
          {board.applications.length > 0 && rows.length === 0 ? <p className="desk-empty">No applications match those filters.</p> : null}

          {view === "board" && rows.length > 0 ? (
            <div className="kanban-scroller">
              <div className="column-order-bar">
                <p className="sr-only">Drag a column by its reorder control, or focus that control and use the arrow keys.</p>
                <button className="btn-line" type="button" onClick={() => void resetOrder()}>Reset order</button>
                {orderNote ? <p className="form-note" role="status">{orderNote}</p> : null}
              </div>
              <KanbanColumns ids={columns.map((column) => column.stage)} onReorder={reorderColumns}>
                {columns.map((column) => (
                  <SortableStageColumn key={column.stage} id={column.stage}>
                    {(handle) => (
                    <>
                    <header>
                      <div>
                        <h3>
                          <label className="mass-check">
                            <input
                              type="checkbox"
                              aria-label={`Select all in ${column.stage}`}
                              checked={column.rows.every((row) => pickedIds.includes(row.id))}
                              disabled={!board.writesEnabled || busy}
                              onChange={(event) => setPicked(column.rows.map((row) => row.id), event.target.checked)}
                            />
                          </label>
                          <button
                            type="button"
                            className="column-drag"
                            aria-label={`Reorder ${column.stage}`}
                            {...handle.attributes}
                            {...handle.listeners}
                          >
                            <span aria-hidden="true">⋮⋮</span>
                          </button>
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
                            <label className="kanban-pick">
                              <input
                                type="checkbox"
                                aria-label={`Select ${application.projectName}`}
                                checked={pickedIds.includes(application.id)}
                                disabled={!board.writesEnabled || busy}
                                onChange={() => togglePicked(application.id)}
                              />
                            </label>
                            <button
                              type="button"
                              className={`kanban-card${application.id === selectedId ? " is-selected" : ""}`}
                              onClick={() => openApplication(application)}
                            >
                              <strong>{application.projectName}</strong>
                              <span className={pipelineChipClass(application.pipeline)}>{pipelineLabel(application.pipeline)}</span>
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
                    </>
                    )}
                  </SortableStageColumn>
                ))}
              </KanbanColumns>
            </div>
          ) : null}

          {view === "table" && rows.length > 0 ? (
            <div className="pipeline-table-wrap">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <input
                        type="checkbox"
                        aria-label="Select all shown applications"
                        checked={sortedRows.length > 0 && sortedRows.every((row) => pickedIds.includes(row.id))}
                        disabled={!board.writesEnabled || busy || sortedRows.length === 0}
                        onChange={(event) => setPicked(sortedRows.map((row) => row.id), event.target.checked)}
                      />
                    </th>
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
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${application.projectName}`}
                            checked={pickedIds.includes(application.id)}
                            disabled={!board.writesEnabled || busy}
                            onChange={() => togglePicked(application.id)}
                          />
                        </td>
                        <th scope="row">
                          <button type="button" className="desk-name" onClick={() => openApplication(application)}>
                            {application.projectName}
                          </button>
                          {application.summary ? <span className="desk-summary">{application.summary}</span> : null}
                        </th>
                        <td><span className={pipelineChipClass(application.pipeline)}>{pipelineShort(application.pipeline)}</span></td>
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

          {selected ? (
            <ApplicationReview
              application={selected}
              writesEnabled={board.writesEnabled}
              busy={busy}
              message={message}
              error={error}
              preview={preview}
              onClose={closeDrawer}
              onSave={saveDraft}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
