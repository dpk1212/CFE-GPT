"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FeedbackDocView } from "@/components/FeedbackDocView";
import { money, shown } from "@/components/admin/adminFormat";
import { stageTone } from "@/components/admin/stageTone";
import { EDITABLE_FIELDS, readEditable, type EditableDeal } from "@/lib/fuelAdmin/fields";
import {
  completeness,
  documentChecklist,
  formatMoney,
  orderedStages,
  pipelineLabel,
  stageSlug,
} from "@/lib/fuelAdmin/metrics";
import type { FuelDeskReview } from "@/lib/fuelAdmin/reviews";
import { FUEL_PIPELINES, FUEL_STATUSES, type FuelApplication } from "@/lib/fuelJudge/types";

type ChangeRow = { label: string; old: string; new: string };
type TabId = "review" | "feedback" | "edit";

export function ApplicationReview({
  application,
  writesEnabled,
  busy,
  message,
  error,
  preview,
  onClose,
  onSave,
}: {
  application: FuelApplication;
  writesEnabled: boolean;
  busy: boolean;
  message: string;
  error: string;
  preview: Record<string, unknown> | null;
  onClose: () => void;
  onSave: (draft: EditableDeal) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<TabId>("review");
  const [draft, setDraft] = useState<EditableDeal>(() => readEditable(application));
  const [pending, setPending] = useState<ChangeRow[]>([]);
  const [reviews, setReviews] = useState<FuelDeskReview[]>([]);
  const [feedbackWarning, setFeedbackWarning] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setDraft(readEditable(application));
    setTab("review");
  }, [application]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/fuel-insights")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          feedbackWarning?: string;
          applications?: { id: string; feedback?: { reviews?: FuelDeskReview[]; notes?: string[] } }[];
        } | null;
        if (cancelled || !response.ok || !body) return;
        const row = body.applications?.find((item) => item.id === application.id);
        setReviews(row?.feedback?.reviews ?? []);
        setFeedbackWarning(body.feedbackWarning ?? "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [application.id]);

  const docs = useMemo(() => documentChecklist(application), [application]);
  const complete = completeness(application);
  const scored = reviews.flatMap((review) => review.scores.map((score) => score.value));
  const average = scored.length
    ? Math.round((scored.reduce((sum, value) => sum + value, 0) / scored.length) * 10) / 10
    : null;

  function askConfirm() {
    const current = readEditable(application);
    const changes = EDITABLE_FIELDS.flatMap((field) => {
      const oldValue = shown(current[field.key]);
      const newValue = shown(draft[field.key]);
      if (oldValue === newValue) return [];
      return [{ label: field.label, old: oldValue, new: newValue }];
    });
    if (!changes.length) return;
    setPending(changes);
    dialogRef.current?.showModal();
  }

  function fieldControl(field: (typeof EDITABLE_FIELDS)[number]) {
    if (field.kind === "stage") {
      return (
        <select value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}>
          {orderedStages([application.stage, draft.stage, ...FUEL_STATUSES]).map((item) => <option key={item}>{item}</option>)}
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
          rows={field.key === "summary" ? 4 : 2}
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
    <div className="drawer-layer">
      <button className="drawer-scrim" type="button" aria-label="Close application" onClick={onClose} />
      <aside className="app-review" aria-label="Application review">
        <header className="app-review-head">
          <div className="app-review-title">
            <p className="cc-eyebrow">Application review</p>
            <h3>{application.projectName}</h3>
            <div className="app-review-meta">
              <span className="pipeline-chip">{pipelineLabel(application.pipeline)}</span>
              <span className={`stage-chip tone-${stageTone(application.stage)}`} data-stage={stageSlug(application.stage)}>
                {application.stage}
              </span>
              <strong>{money(application.fundingRequested)}</strong>
            </div>
          </div>
          <div className="app-review-actions">
            <label className="stage-change">
              Stage
              <select
                value={draft.stage}
                onChange={(event) => {
                  setDraft({ ...draft, stage: event.target.value });
                  setTab("edit");
                }}
              >
                {orderedStages([application.stage, ...FUEL_STATUSES]).map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="btn-line" type="button" onClick={onClose}>Close</button>
          </div>
        </header>

        <div className="app-review-tabs" role="tablist" aria-label="Application panels">
          <button type="button" role="tab" aria-selected={tab === "review"} className={tab === "review" ? "on" : undefined} onClick={() => setTab("review")}>
            Review
          </button>
          <button type="button" role="tab" aria-selected={tab === "feedback"} className={tab === "feedback" ? "on" : undefined} onClick={() => setTab("feedback")}>
            Feedback
          </button>
          <button type="button" role="tab" aria-selected={tab === "edit"} className={tab === "edit" ? "on" : undefined} onClick={() => setTab("edit")}>
            Edit details
          </button>
        </div>

        {tab === "feedback" ? (
          <div className="app-review-feedback">
            <FeedbackDocView applicationId={application.id} />
          </div>
        ) : null}

        {tab === "review" ? (
          <div className="app-review-grid">
            <section className="app-review-panel">
              <h4>Summary</h4>
              <p className="app-summary">{application.summary || "No one-sentence summary is on this deal."}</p>
              <div className="doc-head">
                <h4>Documents</h4>
                <span>{complete.present}/{complete.required} required</span>
              </div>
              <ul className="doc-checklist">
                {docs.map((doc) => (
                  <li key={doc.key} className={doc.url ? "is-present" : "is-missing"}>
                    <span>{doc.label}{doc.required ? "" : " · optional"}</span>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      <em>Missing</em>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="app-review-panel">
              <div className="doc-head">
                <h4>Judge feedback</h4>
                <span>
                  {reviews.length} sheet{reviews.length === 1 ? "" : "s"}
                  {average != null ? ` · avg ${average}` : ""}
                </span>
              </div>
              {application.totalReviews != null ? (
                <p className="quiet">CRM review count: {application.totalReviews}.</p>
              ) : null}
              {feedbackWarning ? <p className="quiet">{feedbackWarning}</p> : null}
              {reviews.length === 0 && application.initialFeedback.length === 0 ? (
                <p className="app-empty-feedback">No judge reviews yet.</p>
              ) : null}
              {application.initialFeedback.map((note, index) => (
                <article key={`note-${index}`} className="feedback-card">
                  <header>
                    <strong>CRM note</strong>
                    <span>Linked feedback</span>
                  </header>
                  <p>{note}</p>
                </article>
              ))}
              {reviews.map((review) => (
                <article key={review.id} className="feedback-card">
                  <header>
                    <strong>{review.reviewer}</strong>
                    <span>
                      {review.kind}
                      {review.dryRun ? " · dry-run" : " · CRM"}
                      {review.average != null ? ` · avg ${review.average}` : ""}
                    </span>
                  </header>
                  {review.scores.length ? (
                    <ul className="score-list">
                      {review.scores.map((score) => (
                        <li key={`${review.id}-${score.label}`}>
                          <span>{score.label}</span>
                          <strong>{score.value}</strong>
                          {score.comment ? <em>{score.comment}</em> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {review.notes.map((note) => (
                    <p key={`${review.id}-${note.label}`}>
                      <span className="note-label">{note.label}</span>
                      {note.text}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          </div>
        ) : null}

        {tab === "edit" ? (
          <form
            className="app-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              askConfirm();
            }}
          >
            <p className="quiet">
              {writesEnabled
                ? "Confirmed edits write to Fuel CRM."
                : "Confirmed edits stay on this desk until admin writes are enabled."}
            </p>
            <div className="app-edit-grid">
              {EDITABLE_FIELDS.map((field) => (
                <label key={field.key} className={field.key === "summary" || field.kind === "url" ? "wide" : undefined}>
                  {field.label}
                  {fieldControl(field)}
                </label>
              ))}
            </div>
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
            <button
              className="btn"
              type="button"
              onClick={() => {
                dialogRef.current?.close();
                void onSave(draft);
              }}
            >
              Confirm
            </button>
          </div>
          {!writesEnabled ? (
            <p className="quiet">This remains a dry run unless admin writes are enabled.</p>
          ) : (
            <p className="quiet">This will write to Fuel CRM. Funding shown as {formatMoney(draft.fundingRequested)}.</p>
          )}
        </dialog>
      </aside>
    </div>
  );
}
