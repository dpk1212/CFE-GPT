"use client";

import { useMemo, useRef, useState } from "react";
import { EDITABLE_FIELDS, readEditable, type EditableDeal } from "@/lib/fuelAdmin/fields";
import type { FuelAuditEntry } from "@/lib/fuelAdmin/store";
import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

type BoardPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  applications: FuelApplication[];
  audit: FuelAuditEntry[];
};

type ChangeRow = { label: string; old: string; new: string };

const GROUPS = [
  { id: "basics", title: "Basics", keys: ["projectName", "stage", "pipeline", "summary", "industries"] },
  { id: "funding", title: "Funding", keys: ["fundingRequested"] },
  { id: "documents", title: "Documents", keys: EDITABLE_FIELDS.filter((field) => field.kind === "url").map((field) => field.key) },
] as const;

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function shown(value: string | number | null) {
  if (value == null || value === "") return "—";
  return String(value);
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableDeal | null>(null);
  const [pending, setPending] = useState<ChangeRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  const groups = useMemo(() => {
    const order = [...FUEL_STATUSES];
    for (const row of rows) {
      if (!order.includes(row.stage as (typeof FUEL_STATUSES)[number])) order.push(row.stage as (typeof FUEL_STATUSES)[number]);
    }
    return order
      .map((name) => ({ stage: name, rows: rows.filter((row) => row.stage === name) }))
      .filter((group) => group.rows.length);
  }, [rows]);

  const emptyStages = FUEL_STATUSES.filter((name) => !rows.some((row) => row.stage === name));
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

  return (
    <section className="pipeline-board" aria-labelledby="pipeline-heading">
      <p id="pipeline-heading" className="sr-only">Pipeline</p>
      {loading && !board ? <p className="desk-status">Loading the Fuel pipeline.</p> : null}
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
            {board.applications.length === 200 ? " Fuel CRM returned 200 applications, which is the read limit." : ""}
          </p>
          <div className="pipeline-tools">
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
          {stage === "All" && emptyStages.length ? (
            <p className="desk-note">Empty right now: {emptyStages.join(", ")}.</p>
          ) : null}
          {groups.map((group) => (
            <section key={group.stage} className="pipeline-group">
              <header>
                <h3>{group.stage}</h3>
                <span>{group.rows.length}</span>
              </header>
              <table className="desk-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Pipeline</th>
                    <th scope="col">Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((application) => (
                    <tr key={application.id} className={application.id === selectedId ? "is-selected" : undefined}>
                      <th scope="row">
                        <button type="button" className="desk-name" onClick={() => openApplication(application)}>
                          {application.projectName}
                        </button>
                        {application.summary ? <span className="desk-summary">{application.summary}</span> : null}
                      </th>
                      <td>{application.pipeline}</td>
                      <td>{money(application.fundingRequested)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
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
