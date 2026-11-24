"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function shown(value: string | number | null) {
  if (value == null || value === "") return "—";
  return String(value);
}

export function PipelineBoard() {
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [pipeline, setPipeline] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableDeal | null>(null);
  const [pending, setPending] = useState<ChangeRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  const rows = useMemo(() => {
    const applications = board?.applications ?? [];
    const needle = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (pipeline !== "All" && application.pipeline !== pipeline) return false;
      if (stageFilter !== "All" && application.stage !== stageFilter) return false;
      if (!needle) return true;
      return [application.projectName, application.summary, application.industries, application.stage, application.pipeline]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [board, pipeline, query, stageFilter]);

  const groups = useMemo(() => {
    const order = [...FUEL_STATUSES];
    for (const row of rows) {
      if (!order.includes(row.stage as (typeof FUEL_STATUSES)[number])) order.push(row.stage as (typeof FUEL_STATUSES)[number]);
    }
    return order
      .map((stage) => ({ stage, rows: rows.filter((row) => row.stage === stage) }))
      .filter((group) => group.rows.length);
  }, [rows]);

  const selected = board?.applications.find((row) => row.id === selectedId) ?? null;

  function openApplication(application: FuelApplication) {
    setSelectedId(application.id);
    setDraft(readEditable(application));
    setMessage("");
    setError("");
    setPreview(null);
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
      record?: Record<string, unknown>;
    } | null;
    setBusy(false);
    if (!response.ok || !body?.application) {
      setError(body?.error ?? "The application was not updated.");
      return;
    }
    setPreview(body.wrote ? null : (body.record ?? null));
    setMessage(body.wrote ? `Saved ${body.application.projectName} in Fuel CRM.` : `Dry run for ${body.application.projectName}. Fuel CRM was not updated.`);
    await load();
    setSelectedId(body.application.id);
    setDraft(readEditable(body.application));
  }

  return (
    <section className="pipeline-board" aria-labelledby="pipeline-heading">
      <div className="fuel-config-head">
        <h2 id="pipeline-heading">Pipeline</h2>
        <p>
          Every Fuel application, grouped by stage. Owner, contact, cycle, and deadline are not fields this desk reads, so they are not edited here.
        </p>
      </div>
      {loading && !board ? <p className="desk-status">Loading the Fuel pipeline.</p> : null}
      {loadError ? (
        <div>
          <p className="form-note" role="alert">{loadError}</p>
          <button className="btn" type="button" onClick={() => void load()}>Try again</button>
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
              <select value={pipeline} onChange={(event) => setPipeline(event.target.value)}>
                <option>All</option>
                {FUEL_PIPELINES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Stage
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                <option>All</option>
                {FUEL_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className={selected ? "pipeline-layout is-open" : "pipeline-layout"}>
            <div className="pipeline-groups">
              {board.applications.length === 0 ? <p className="desk-empty">No Fuel applications are on this desk.</p> : null}
              {board.applications.length > 0 && rows.length === 0 ? <p className="desk-empty">No applications match those filters.</p> : null}
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
            </div>
            <aside className="pipeline-drawer" aria-label="Application detail">
              {!selected || !draft ? (
                <p className="desk-empty">Select an application to review its fields.</p>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    askConfirm();
                  }}
                >
                  <div className="read-head">
                    <h3>{selected.projectName}</h3>
                    <button className="btn-line" type="button" onClick={() => { setSelectedId(null); setDraft(null); }}>Close</button>
                  </div>
                  {EDITABLE_FIELDS.map((field) => (
                    <label key={field.key}>
                      {field.label}
                      {field.kind === "stage" ? (
                        <select value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}>
                          {FUEL_STATUSES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      ) : field.kind === "pipeline" ? (
                        <select value={draft.pipeline} onChange={(event) => setDraft({ ...draft, pipeline: event.target.value })}>
                          {FUEL_PIPELINES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      ) : field.kind === "money" ? (
                        <input
                          inputMode="numeric"
                          value={draft.fundingRequested ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value.trim();
                            if (raw === "") setDraft({ ...draft, fundingRequested: null });
                            else if (/^\d+(\.\d+)?$/.test(raw)) setDraft({ ...draft, fundingRequested: Number(raw) });
                          }}
                        />
                      ) : field.kind === "url" || field.key === "summary" ? (
                        <textarea
                          rows={field.key === "summary" ? 3 : 2}
                          value={(draft[field.key] as string | null) ?? ""}
                          onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                        />
                      ) : (
                        <input
                          value={String(draft[field.key] ?? "")}
                          onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                        />
                      )}
                    </label>
                  ))}
                  <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Review change"}</button>
                  {error ? <p className="form-note" role="alert">{error}</p> : null}
                  {message ? <p className="form-note" role="status">{message}</p> : null}
                  {preview ? (
                    <details className="payload-preview">
                      <summary>Dry-run payload</summary>
                      <pre>{JSON.stringify(preview, null, 2)}</pre>
                    </details>
                  ) : null}
                </form>
              )}
            </aside>
          </div>
          <div className="pipeline-audit">
            <h3>Recent field changes</h3>
            {board.audit.length === 0 ? <p>No field changes have been recorded.</p> : (
              <ul>
                {board.audit.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.projectName}</strong>
                    <span>{entry.wrote ? "Written to Fuel CRM" : "Dry run"} · {entry.email} · {new Date(entry.at).toLocaleString("en-US", { timeZone: "America/New_York" })} ET</span>
                    {entry.changes.map((change) => (
                      <span key={`${entry.id}-${change.field}`}>{change.label}: {change.old || "—"} → {change.new || "—"}</span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
