"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  COLUMN_LABELS,
  CONFIDENTIALITY_PARAGRAPH,
  FORM_STEPS,
  RATING_SCALE,
  WRITTEN_RUBRIC,
} from "@/lib/fuelJudge/columns";
import type {
  FuelApplication,
  FuelColumnId,
  FuelFormId,
  FuelStageConfig,
  PitchReviewInput,
  WrittenReviewInput,
} from "@/lib/fuelJudge/types";

type DashboardPayload = {
  mode: "live" | "mock";
  writesEnabled: boolean;
  stage: FuelStageConfig;
  applications: FuelApplication[];
  syncing?: boolean;
};

type Props = {
  judgeName: string;
  judgeEmail: string;
};

type WrittenDraft = {
  conflict: "" | "Yes" | "No";
  confidentiality: boolean;
  ratings: WrittenReviewInput["ratings"];
  feedback: WrittenReviewInput["feedback"];
  strengths: string;
  improvements: string;
  advance: "" | "yes" | "no";
  coach: string;
  internalNotes: string;
};

type PitchDraft = {
  conflict: "" | "Yes" | "No";
  confidentiality: boolean;
  didWell: string;
  prioritize: string;
  coach: string;
  funding: "" | "yes" | "no";
  internalNotes: string;
};

type SortKey = "projectName" | "stage" | "fundingRequested" | "totalReviews";

const LINK_COLUMNS = new Set<FuelColumnId>([
  "fuelApplication",
  "budgetUrl",
  "quadChart",
  "technicalEvidence",
  "traction",
  "images",
  "pitchDeck",
  "video",
  "additional",
]);

const emptyRatings = { problem: 0, solution: 0, market: 0, freedom: 0, execution: 0 };

function blankWritten(): WrittenDraft {
  return {
    conflict: "",
    confidentiality: false,
    ratings: { ...emptyRatings },
    feedback: {},
    strengths: "",
    improvements: "",
    advance: "",
    coach: "",
    internalNotes: "",
  };
}

function blankPitch(): PitchDraft {
  return {
    conflict: "",
    confidentiality: false,
    didWell: "",
    prioritize: "",
    coach: "",
    funding: "",
    internalNotes: "",
  };
}

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function draftKey(email: string, stageId: string, applicationId: string) {
  return `epp-fuel-draft:${email}:${stageId}:${applicationId}`;
}

function reviewedKey(email: string, stageId: string) {
  return `epp-fuel-reviewed:${email}:${stageId}`;
}

function readReviewed(email: string, stageId: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(reviewedKey(email, stageId)) ?? "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function linkFor(application: FuelApplication, column: FuelColumnId) {
  const map: Partial<Record<FuelColumnId, string | null>> = {
    fuelApplication: application.fuelApplicationUrl,
    budgetUrl: application.budgetUrl,
    quadChart: application.quadChartUrl,
    technicalEvidence: application.technicalEvidenceUrl,
    traction: application.tractionUrl,
    images: application.imagesUrl,
    pitchDeck: application.pitchDeckUrl,
    video: application.videoUrl,
    additional: application.additionalUrl,
  };
  const href = map[column];
  return href ? { href, label: COLUMN_LABELS[column] } : null;
}

function writtenBlank(draft: WrittenDraft) {
  return (
    !draft.conflict &&
    !draft.confidentiality &&
    !Object.values(draft.ratings).some(Boolean) &&
    !Object.values(draft.feedback).some((value) => value?.trim()) &&
    !draft.strengths.trim() &&
    !draft.improvements.trim() &&
    !draft.advance &&
    !draft.coach.trim() &&
    !draft.internalNotes.trim()
  );
}

function pitchBlank(draft: PitchDraft) {
  return (
    !draft.conflict &&
    !draft.confidentiality &&
    !draft.didWell.trim() &&
    !draft.prioritize.trim() &&
    !draft.coach.trim() &&
    !draft.funding &&
    !draft.internalNotes.trim()
  );
}

export function JudgeWorkspace({ judgeName, judgeEmail }: Props) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [written, setWritten] = useState<WrittenDraft>(blankWritten);
  const [pitch, setPitch] = useState<PitchDraft>(blankPitch);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payloadPreview, setPayloadPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "projectName", dir: "asc" });
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const loadedSnapshot = useRef("");

  function load() {
    setLoading(true);
    setLoadError("");
    return fetch("/api/judge/dashboard")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (DashboardPayload & { error?: string }) | null;
        if (!response.ok || !body || body.error || !body.stage) {
          setLoadError(body?.error ?? "The Fuel desk could not be loaded.");
          setDashboard(null);
          return;
        }
        setDashboard(body);
        setReviewed(readReviewed(judgeEmail, body.stage.id));
      })
      .catch(() => setLoadError("The Fuel desk could not be loaded."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/judge/dashboard")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (DashboardPayload & { error?: string }) | null;
        if (cancelled) return;
        if (!response.ok || !body || body.error || !body.stage) {
          setLoadError(body?.error ?? "The Fuel desk could not be loaded.");
          return;
        }
        setDashboard(body);
        setReviewed(readReviewed(judgeEmail, body.stage.id));
      })
      .catch(() => {
        if (!cancelled) setLoadError("The Fuel desk could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [judgeEmail]);

  const rows = useMemo(() => {
    const applications = dashboard?.applications ?? [];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? applications.filter((application) =>
          [application.projectName, application.summary, application.industries, application.stage]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : applications;
    const direction = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sort.key === "fundingRequested" || sort.key === "totalReviews" ? (a[sort.key] ?? -1) : a[sort.key].toLowerCase();
      const right = sort.key === "fundingRequested" || sort.key === "totalReviews" ? (b[sort.key] ?? -1) : b[sort.key].toLowerCase();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return a.projectName.localeCompare(b.projectName);
    });
  }, [dashboard, query, sort]);

  useEffect(() => {
    if (!rows.length) return;
    if (selectedId && rows.some((row) => row.id === selectedId)) return;
    setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const selected = dashboard?.applications.find((row) => row.id === selectedId) ?? null;
  const selectedIndex = rows.findIndex((row) => row.id === selectedId);
  const reviewedCount = dashboard?.applications.filter((row) => reviewed.has(row.id)).length ?? 0;
  const openCount = (dashboard?.applications.length ?? 0) - reviewedCount;

  useEffect(() => {
    if (!dashboard || !selectedId) return;
    const key = draftKey(judgeEmail, dashboard.stage.id, selectedId);
    let nextWritten = blankWritten();
    let nextPitch = blankPitch();
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as
        | { form: "written"; draft: WrittenDraft }
        | { form: "pitch"; draft: PitchDraft }
        | null;
      if (saved?.form === "written") {
        nextWritten = { ...blankWritten(), ...saved.draft, ratings: { ...emptyRatings, ...saved.draft.ratings } };
      }
      if (saved?.form === "pitch") nextPitch = { ...blankPitch(), ...saved.draft };
    } catch {
      nextWritten = blankWritten();
      nextPitch = blankPitch();
    }
    setWritten(nextWritten);
    setPitch(nextPitch);
    loadedSnapshot.current =
      dashboard.stage.form === "written"
        ? JSON.stringify({ form: "written", draft: nextWritten })
        : JSON.stringify({ form: "pitch", draft: nextPitch });
    setFormStep(1);
    setHydratedFor(selectedId);
    setDraftNote("");
    setError("");
    setMessage("");
    setPayloadPreview(null);
  }, [dashboard, judgeEmail, selectedId]);

  useEffect(() => {
    if (!dashboard || !selectedId || hydratedFor !== selectedId) return;
    const key = draftKey(judgeEmail, dashboard.stage.id, selectedId);
    const handle = window.setTimeout(() => {
      const blank = dashboard.stage.form === "written" ? writtenBlank(written) : pitchBlank(pitch);
      const payload = dashboard.stage.form === "written" ? { form: "written" as const, draft: written } : { form: "pitch" as const, draft: pitch };
      const serialized = JSON.stringify(payload);
      if (blank) {
        localStorage.removeItem(key);
        loadedSnapshot.current = serialized;
        return;
      }
      if (serialized === loadedSnapshot.current) return;
      localStorage.setItem(key, serialized);
      loadedSnapshot.current = serialized;
      setDraftNote("Draft saved on this browser.");
    }, 450);
    return () => window.clearTimeout(handle);
  }, [dashboard, hydratedFor, judgeEmail, pitch, selectedId, written]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      const inQueue = Boolean(target?.closest(".desk-queue"));
      if (target && target !== document.body && !inQueue) return;
      if (!rows.length) return;
      if (event.key !== "j" && event.key !== "k" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const current = Math.max(0, rows.findIndex((row) => row.id === selectedId));
      const next = event.key === "j" || event.key === "ArrowDown" ? Math.min(rows.length - 1, current + 1) : Math.max(0, current - 1);
      setSelectedId(rows[next]?.id ?? null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, selectedId]);

  function toggleSort(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function move(offset: number) {
    if (!rows.length) return;
    const current = Math.max(0, rows.findIndex((row) => row.id === selectedId));
    const next = Math.min(rows.length - 1, Math.max(0, current + offset));
    setSelectedId(rows[next]?.id ?? null);
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!dashboard || !selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    const payload =
      dashboard.stage.form === "written"
        ? ({
            form: "written",
            applicationId: selected.id,
            conflict: written.conflict,
            confidentiality: written.confidentiality ? true : false,
            ratings: written.ratings,
            feedback: written.feedback,
            strengths: written.strengths,
            improvements: written.improvements,
            advance: written.advance,
            coach: written.coach,
            internalNotes: written.internalNotes,
          } as WrittenReviewInput)
        : ({
            form: "pitch",
            applicationId: selected.id,
            conflict: pitch.conflict || undefined,
            confidentiality: pitch.confidentiality ? true : false,
            didWell: pitch.didWell,
            prioritize: pitch.prioritize,
            coach: pitch.coach,
            funding: pitch.funding,
            internalNotes: pitch.internalNotes,
          } as PitchReviewInput);

    const response = await fetch("/api/judge/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      project?: string;
      wrote?: boolean;
      record?: Record<string, unknown>;
    } | null;
    setBusy(false);
    if (!response.ok) {
      setError(body?.error ?? "The review was not saved.");
      return;
    }
    const nextReviewed = new Set(reviewed);
    nextReviewed.add(selected.id);
    setReviewed(nextReviewed);
    localStorage.setItem(reviewedKey(judgeEmail, dashboard.stage.id), JSON.stringify([...nextReviewed]));
    localStorage.removeItem(draftKey(judgeEmail, dashboard.stage.id, selected.id));
    setWritten(blankWritten());
    setPitch(blankPitch());
    setFormStep(1);
    setDraftNote("");
    setPayloadPreview(body?.wrote ? null : (body?.record ?? null));
    setMessage(
      body?.wrote
        ? `Review submitted for ${body.project}.`
        : `Review recorded for ${body?.project ?? selected.projectName}. CRM writes are off, so this stayed on the desk.`,
    );
    const position = rows.findIndex((row) => row.id === selected.id);
    const following = rows[position + 1];
    if (following) setSelectedId(following.id);
  }

  if (loading) {
    return (
      <div className="desk-page" aria-busy="true">
        <p className="desk-status">Loading the Fuel desk.</p>
      </div>
    );
  }

  if (loadError || !dashboard) {
    return (
      <div className="desk-page">
        <p className="form-note" role="alert">{loadError || "The Fuel desk could not be loaded."}</p>
        <button className="btn" type="button" onClick={() => void load()}>Try again</button>
      </div>
    );
  }

  const formId: FuelFormId = dashboard.stage.form;
  const columns = new Set(dashboard.stage.columns);
  const materials = dashboard.stage.columns
    .filter((column) => LINK_COLUMNS.has(column))
    .map((column) => ({ column, link: selected ? linkFor(selected, column) : null }));

  return (
    <div className="desk-page">
      <header className="desk-stage">
        <div>
          <p className="desk-kicker">Fuel</p>
          <h1>{dashboard.stage.name}</h1>
          <p className="desk-statuses">{dashboard.stage.statuses.join(" · ")}</p>
        </div>
        <dl className="desk-counts">
          <div>
            <dt>In this stage</dt>
            <dd>{dashboard.applications.length}</dd>
          </div>
          <div>
            <dt>Reviewed by you</dt>
            <dd>{reviewedCount}</dd>
          </div>
          <div>
            <dt>Still open</dt>
            <dd>{openCount}</dd>
          </div>
        </dl>
      </header>
      {dashboard.syncing ? <p className="desk-note">CRM syncing</p> : null}
      <p className="desk-note">
        Signed in as {judgeName}. Every approved judge sees this queue.
        {dashboard.mode === "mock"
          ? " These are sample applications. Nothing on this desk is written to Zoho."
          : dashboard.writesEnabled
            ? " Applications are read from Fuel CRM."
            : " Applications are read from Fuel CRM. A submitted review stays on this desk until CRM writes are turned on."}
      </p>

      <div className="desk-workspace">
        <section className="desk-queue" aria-label="Applications for review">
          <div className="desk-queue-bar">
            <h2>Applications</h2>
            <label className="desk-search">
              <span className="sr-only">Search applications</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, summary, or industry"
                type="search"
              />
            </label>
          </div>
          <div className="desk-sort">
            <span>Sort</span>
            <SortButton label="Project" sortKey="projectName" sort={sort} onSort={toggleSort} />
            <SortButton label="Status" sortKey="stage" sort={sort} onSort={toggleSort} />
            {columns.has("fundingRequested") ? <SortButton label="Funding" sortKey="fundingRequested" sort={sort} onSort={toggleSort} /> : null}
            {columns.has("totalReviews") ? <SortButton label="Reviews" sortKey="totalReviews" sort={sort} onSort={toggleSort} /> : null}
          </div>
          {dashboard.applications.length === 0 ? (
            <p className="desk-empty">No applications are in {dashboard.stage.statuses.join(" or ")}.</p>
          ) : rows.length === 0 ? (
            <p className="desk-empty">No applications match that search.</p>
          ) : (
            <div className="desk-table-wrap">
              <table className="desk-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    {columns.has("fundingRequested") ? <th scope="col">Funding</th> : null}
                    {columns.has("totalReviews") ? <th scope="col">Reviews</th> : null}
                    <th scope="col">You</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((application) => {
                    const mine = reviewed.has(application.id);
                    const active = application.id === selectedId;
                    return (
                      <tr
                        key={application.id}
                        className={active ? "is-selected" : undefined}
                        aria-selected={active}
                        onClick={() => setSelectedId(application.id)}
                      >
                        <th scope="row">
                          <button type="button" className="desk-name" onClick={() => setSelectedId(application.id)}>
                            {application.projectName}
                          </button>
                          {columns.has("summary") ? <span className="desk-summary">{application.summary}</span> : null}
                          <span className="status-chip">{application.stage}</span>
                        </th>
                        {columns.has("fundingRequested") ? <td>{money(application.fundingRequested)}</td> : null}
                        {columns.has("totalReviews") ? <td>{application.totalReviews ?? "—"}</td> : null}
                        <td>{mine ? <span className="mine-chip">Reviewed</span> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="desk-keys">J and K move through the queue when you are not typing in a field.</p>
        </section>

        <section className="desk-read" aria-label="Application and review">
          {!selected ? (
            <p className="desk-empty">Select an application to read it and start a review.</p>
          ) : (
            <>
              <div className="read-head">
                <div>
                  <p className="eyebrow">Application {selectedIndex >= 0 ? selectedIndex + 1 : "—"} of {rows.length}</p>
                  <h2>{selected.projectName}</h2>
                  <span className="status-chip">{selected.stage}</span>
                </div>
                <div className="read-move">
                  <button className="btn-line" type="button" onClick={() => move(-1)} disabled={selectedIndex <= 0}>Previous</button>
                  <button className="btn-line" type="button" onClick={() => move(1)} disabled={selectedIndex < 0 || selectedIndex >= rows.length - 1}>Next</button>
                </div>
              </div>
              <p className="read-summary">{selected.summary || "No one-sentence summary is on this application."}</p>
              <dl className="read-facts">
                {columns.has("industries") ? (
                  <div><dt>Industries</dt><dd>{selected.industries || "—"}</dd></div>
                ) : null}
                {columns.has("fundingRequested") ? (
                  <div><dt>Funding requested</dt><dd>{money(selected.fundingRequested)}</dd></div>
                ) : null}
                {columns.has("totalReviews") ? (
                  <div><dt>Total reviews</dt><dd>{selected.totalReviews ?? "—"}</dd></div>
                ) : null}
              </dl>
              {materials.length ? (
                <ul className="read-links">
                  {materials.map(({ column, link }) => (
                    <li key={column}>
                      {link ? (
                        <a href={link.href} target="_blank" rel="noreferrer">
                          {link.label}
                          <span aria-hidden="true"> ↗</span>
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <span>{COLUMN_LABELS[column]} is not attached</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
              {columns.has("initialFeedback") ? (
                <div className="read-feedback">
                  <h3>Initial judge feedback</h3>
                  {selected.initialFeedback.length ? (
                    selected.initialFeedback.map((note) => <p key={note}>{note}</p>)
                  ) : (
                    <p>No stage 1 feedback is on this application yet.</p>
                  )}
                </div>
              ) : null}

              <form className="judge-form" onSubmit={submitReview}>
                <div className="judge-form-head">
                  <p className="eyebrow">Step {formStep} of {FORM_STEPS[formId].length}</p>
                  <ol className="form-steps" aria-label="Review steps">
                    {FORM_STEPS[formId].map((label, index) => {
                      const step = index + 1;
                      return (
                        <li key={label} className={formStep === step ? "on" : formStep > step ? "done" : undefined}>
                          <button type="button" onClick={() => setFormStep(step)}>
                            <em>{step}</em>
                            <span>{label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  {draftNote ? <p className="draft-note" role="status">{draftNote}</p> : null}
                </div>
                {formId === "written" ? (
                  <WrittenForm step={formStep} draft={written} judgeName={judgeName} judgeEmail={judgeEmail} projectName={selected.projectName} onChange={setWritten} />
                ) : (
                  <PitchForm step={formStep} draft={pitch} judgeName={judgeName} judgeEmail={judgeEmail} projectName={selected.projectName} onChange={setPitch} />
                )}
                <div className="judge-form-actions">
                  {formStep > 1 ? (
                    <button className="btn-line" type="button" onClick={() => setFormStep((step) => step - 1)}>Back</button>
                  ) : <span />}
                  {formStep < 3 ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        if (formStep === 1 && !(formId === "written" ? written.confidentiality : pitch.confidentiality)) {
                          setError("The confidentiality agreement is required.");
                          return;
                        }
                        if (formStep === 1 && formId === "written" && !written.conflict) {
                          setError("Choose whether you have a conflict of interest.");
                          return;
                        }
                        if (formStep === 2 && formId === "written" && Object.values(written.ratings).some((value) => !value)) {
                          setError("Each category needs a rating from 1 to 5.");
                          return;
                        }
                        setError("");
                        setFormStep((step) => step + 1);
                      }}
                    >
                      Continue
                    </button>
                  ) : (
                    <button className="btn" type="submit" disabled={busy}>{busy ? "Submitting…" : formId === "pitch" ? "Submit recommendation" : "Submit review"}</button>
                  )}
                </div>
                {error ? <p className="form-note" role="alert">{error}</p> : null}
                {message ? <p className="form-note" role="status">{message}</p> : null}
                {payloadPreview ? (
                  <details className="payload-preview">
                    <summary>Dry-run payload</summary>
                    <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
                  </details>
                ) : null}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SortButton({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <button type="button" aria-pressed={active} onClick={() => onSort(sortKey)}>
      {label}
      {active ? <span aria-hidden="true">{sort.dir === "asc" ? " ↑" : " ↓"}</span> : null}
    </button>
  );
}

function IdentityBlock({
  judgeName,
  judgeEmail,
  projectName,
  conflict,
  confidentiality,
  conflictRequired,
  onConflict,
  onConfidentiality,
}: {
  judgeName: string;
  judgeEmail: string;
  projectName: string;
  conflict: "" | "Yes" | "No";
  confidentiality: boolean;
  conflictRequired: boolean;
  onConflict: (value: "" | "Yes" | "No") => void;
  onConfidentiality: (value: boolean) => void;
}) {
  return (
    <div className="form-page">
      <h3>Contact info</h3>
      <div className="identity-grid">
        <label>
          Name
          <input value={judgeName} readOnly />
        </label>
        <label>
          Email
          <input value={judgeEmail} readOnly />
        </label>
        <label className="full">
          Project you are evaluating
          <input value={projectName} readOnly />
        </label>
      </div>
      <fieldset className="choice-set">
        <legend>Conflict of interest{conflictRequired ? "" : " (optional)"}</legend>
        <p className="field-help">
          If you have a conflict with this project, contact Alison Smith at <a href="mailto:alisone@umich.edu">alisone@umich.edu</a>.
        </p>
        <label className="radio-line">
          <input type="radio" name="conflict" checked={conflict === "Yes"} onChange={() => onConflict("Yes")} />
          Yes
        </label>
        <label className="radio-line">
          <input type="radio" name="conflict" checked={conflict === "No"} onChange={() => onConflict("No")} />
          No
        </label>
      </fieldset>
      <div className="confidentiality-block">
        <h4>Maintaining students&apos; confidentiality</h4>
        <p>{CONFIDENTIALITY_PARAGRAPH}</p>
        <label className="check-line">
          <input type="checkbox" checked={confidentiality} onChange={(event) => onConfidentiality(event.target.checked)} required />
          <span>I agree to maintain the confidentiality of all information related to the students&apos; ventures presented during the Fuel program.</span>
        </label>
      </div>
    </div>
  );
}

function WrittenForm({
  step,
  draft,
  judgeName,
  judgeEmail,
  projectName,
  onChange,
}: {
  step: number;
  draft: WrittenDraft;
  judgeName: string;
  judgeEmail: string;
  projectName: string;
  onChange: (next: WrittenDraft) => void;
}) {
  if (step === 1) {
    return (
      <IdentityBlock
        judgeName={judgeName}
        judgeEmail={judgeEmail}
        projectName={projectName}
        conflict={draft.conflict}
        confidentiality={draft.confidentiality}
        conflictRequired
        onConflict={(conflict) => onChange({ ...draft, conflict })}
        onConfidentiality={(confidentiality) => onChange({ ...draft, confidentiality })}
      />
    );
  }
  if (step === 2) {
    return (
      <div className="form-page">
        <h3>Ratings</h3>
        <ul className="scale-legend">
          {RATING_SCALE.map((option) => (
            <li key={option.value}><strong>{option.value}</strong> {option.label}</li>
          ))}
        </ul>
        <div className="rubric-list">
          {WRITTEN_RUBRIC.map((item) => (
            <fieldset key={item.key} className="rubric-card">
              <legend>{item.title}</legend>
              <p className="field-help">{item.hint}</p>
              <p className="field-help">{item.consider}</p>
              <div className="rating-row" role="radiogroup" aria-label={item.title}>
                {RATING_SCALE.map((option) => (
                  <label key={option.value} className={draft.ratings[item.key] === option.value ? "on" : undefined}>
                    <input
                      type="radio"
                      name={`rating-${item.key}`}
                      checked={draft.ratings[item.key] === option.value}
                      onChange={() => onChange({ ...draft, ratings: { ...draft.ratings, [item.key]: option.value } })}
                    />
                    <strong>{option.value}</strong>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <label>
                Optional note
                <textarea
                  rows={3}
                  value={draft.feedback[item.key] ?? ""}
                  onChange={(event) => onChange({ ...draft, feedback: { ...draft.feedback, [item.key]: event.target.value } })}
                />
              </label>
            </fieldset>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="form-page">
      <h3>Advice and submission</h3>
      <label>
        Strengths and highlights
        <span className="field-help">Shown to the applicant without your name.</span>
        <textarea rows={4} value={draft.strengths} onChange={(event) => onChange({ ...draft, strengths: event.target.value })} />
      </label>
      <label>
        Areas for improvement
        <span className="field-help">Shown to the applicant without your name.</span>
        <textarea rows={4} value={draft.improvements} onChange={(event) => onChange({ ...draft, improvements: event.target.value })} />
      </label>
      <fieldset className="choice-set">
        <legend>Should this team advance to presenting this month?</legend>
        <label className="radio-line">
          <input type="radio" name="advance" checked={draft.advance === "yes"} onChange={() => onChange({ ...draft, advance: "yes" })} />
          Yes, this team should advance
        </label>
        <label className="radio-line">
          <input type="radio" name="advance" checked={draft.advance === "no"} onChange={() => onChange({ ...draft, advance: "no" })} />
          No, this team has more work to do
        </label>
      </fieldset>
      <label>
        A coach or contact for this team
        <textarea rows={3} value={draft.coach} onChange={(event) => onChange({ ...draft, coach: event.target.value })} />
      </label>
      <label>
        Internal notes
        <span className="field-help">Kept with CFE Fuel staff. Not shown to applicants.</span>
        <textarea rows={3} value={draft.internalNotes} onChange={(event) => onChange({ ...draft, internalNotes: event.target.value })} />
      </label>
    </div>
  );
}

function PitchForm({
  step,
  draft,
  judgeName,
  judgeEmail,
  projectName,
  onChange,
}: {
  step: number;
  draft: PitchDraft;
  judgeName: string;
  judgeEmail: string;
  projectName: string;
  onChange: (next: PitchDraft) => void;
}) {
  if (step === 1) {
    return (
      <IdentityBlock
        judgeName={judgeName}
        judgeEmail={judgeEmail}
        projectName={projectName}
        conflict={draft.conflict}
        confidentiality={draft.confidentiality}
        conflictRequired={false}
        onConflict={(conflict) => onChange({ ...draft, conflict })}
        onConfidentiality={(confidentiality) => onChange({ ...draft, confidentiality })}
      />
    );
  }
  if (step === 2) {
    return (
      <div className="form-page">
        <h3>Feedback</h3>
        <label>
          What did the team do well?
          <textarea rows={4} value={draft.didWell} onChange={(event) => onChange({ ...draft, didWell: event.target.value })} />
        </label>
        <label>
          What should this team prioritize?
          <span className="field-help">Business plan, pitch, or anything else about the venture.</span>
          <textarea rows={4} value={draft.prioritize} onChange={(event) => onChange({ ...draft, prioritize: event.target.value })} />
        </label>
        <label>
          A coach or contact for this team
          <span className="field-help">Contact information is passed to the student team. Skip this if you already named someone in the written review.</span>
          <textarea rows={3} value={draft.coach} onChange={(event) => onChange({ ...draft, coach: event.target.value })} />
        </label>
      </div>
    );
  }
  return (
    <div className="form-page">
      <h3>Funding recommendation</h3>
      <fieldset className="choice-set">
        <legend>Should this team receive Fuel funding?</legend>
        <label className="radio-line">
          <input type="radio" name="funding" checked={draft.funding === "yes"} onChange={() => onChange({ ...draft, funding: "yes" })} />
          Yes
        </label>
        <label className="radio-line">
          <input type="radio" name="funding" checked={draft.funding === "no"} onChange={() => onChange({ ...draft, funding: "no" })} />
          No, not at this time
        </label>
      </fieldset>
      <label>
        Internal notes
        <span className="field-help">Kept with CFE Fuel staff. You may name milestones to fund, or a minimum or maximum amount.</span>
        <textarea rows={4} value={draft.internalNotes} onChange={(event) => onChange({ ...draft, internalNotes: event.target.value })} />
      </label>
    </div>
  );
}
