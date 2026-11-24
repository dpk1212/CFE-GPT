"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { InitialJudgesFeedbackPanel } from "@/components/InitialJudgesFeedbackPanel";
import {
  COLUMN_LABELS,
  CONFIDENTIALITY_PARAGRAPH,
  FORM_STEPS,
  RATING_SCALE,
  WRITTEN_RUBRIC,
} from "@/lib/fuelJudge/columns";
import { pipelineChipClass, pipelineLabel } from "@/lib/fuelAdmin/metrics";
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
  adminView?: boolean;
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

const QUEUE_STORAGE_KEY = "epp-judge-queue-open";
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

function hasStoredDraft(email: string, stageId: string, applicationId: string) {
  try {
    return Boolean(localStorage.getItem(draftKey(email, stageId, applicationId)));
  } catch {
    return false;
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

function industryChips(value: string | null | undefined) {
  if (!value?.trim()) return [];
  return value
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function JudgeWorkspace({ judgeName, judgeEmail, adminView = false }: Props) {
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
  const [queueOpen, setQueueOpen] = useState(false);
  const [draftTick, setDraftTick] = useState(0);
  const loadedSnapshot = useRef("");
  const queueRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    try {
      if (sessionStorage.getItem(QUEUE_STORAGE_KEY) === "1") setQueueOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

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
  const formId: FuelFormId | null = dashboard?.stage.form ?? null;
  const dirty =
    Boolean(dashboard && selectedId && formId) &&
    !(selectedId && reviewed.has(selectedId)) &&
    (formId === "written" ? !writtenBlank(written) : !pitchBlank(pitch));

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
        setDraftTick((value) => value + 1);
        return;
      }
      if (serialized === loadedSnapshot.current) return;
      localStorage.setItem(key, serialized);
      loadedSnapshot.current = serialized;
      setDraftNote("Draft saved on this browser.");
      setDraftTick((value) => value + 1);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [dashboard, hydratedFor, judgeEmail, pitch, selectedId, written]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      /* Feedback question stepper owns Left/Right while focused — do not steal them for app nav. */
      if (target?.closest(".feedback-stepper") || document.activeElement?.closest?.(".feedback-stepper")) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") return;
      }
      if (!rows.length) return;
      const forward = event.key === "j" || event.key === "ArrowDown" || event.key === "ArrowRight";
      const backward = event.key === "k" || event.key === "ArrowUp" || event.key === "ArrowLeft";
      if (!forward && !backward) return;
      event.preventDefault();
      const current = Math.max(0, rows.findIndex((row) => row.id === selectedId));
      const nextId = rows[forward ? Math.min(rows.length - 1, current + 1) : Math.max(0, current - 1)]?.id ?? null;
      if (!nextId || nextId === selectedId) return;
      if (dirty && !window.confirm("You have unsaved review input on this application. Leave anyway?")) return;
      setSelectedId(nextId);
      setQueueOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, rows, selectedId]);

  useEffect(() => {
    if (!queueOpen) return;
    function onPointer(event: MouseEvent) {
      if (!queueRef.current?.contains(event.target as Node)) setQueueOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setQueueOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [queueOpen]);

  function toggleSort(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function toggleQueue() {
    setQueueOpen((value) => {
      const next = !value;
      try {
        sessionStorage.setItem(QUEUE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function confirmLeave() {
    if (!dirty) return true;
    return window.confirm("You have unsaved review input on this application. Leave anyway?");
  }

  function selectApplication(id: string | null) {
    if (!id || id === selectedId) return;
    if (!confirmLeave()) return;
    setSelectedId(id);
    setQueueOpen(false);
  }

  function move(offset: number) {
    if (!rows.length) return;
    const current = Math.max(0, rows.findIndex((row) => row.id === selectedId));
    const next = Math.min(rows.length - 1, Math.max(0, current + offset));
    selectApplication(rows[next]?.id ?? null);
  }

  function appStatus(applicationId: string): "submitted" | "draft" | "open" {
    if (reviewed.has(applicationId)) return "submitted";
    if (!dashboard) return "open";
    if (applicationId === selectedId && dirty) return "draft";
    if (hasStoredDraft(judgeEmail, dashboard.stage.id, applicationId)) return "draft";
    return "open";
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
      request?: Record<string, unknown>;
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
    setDraftTick((value) => value + 1);
    setPayloadPreview(body?.wrote ? null : adminView ? (body?.request ?? null) : (body?.record ?? null));
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
      <div className="desk-page judge-desk judge-workbench-desk" aria-busy="true">
        <div className="cc-skeleton">
          <div className="cc-card is-skeleton tall" />
        </div>
      </div>
    );
  }

  if (loadError || !dashboard || !formId) {
    return (
      <div className="desk-page judge-desk judge-workbench-desk">
        <p className="form-note" role="alert">{loadError || "The Fuel desk could not be loaded."}</p>
        <button className="btn" type="button" onClick={() => void load()}>Try again</button>
      </div>
    );
  }

  const columns = new Set(dashboard.stage.columns);
  const materials = dashboard.stage.columns
    .filter((column) => LINK_COLUMNS.has(column))
    .map((column) => ({ column, link: selected ? linkFor(selected, column) : null }));
  const progress = dashboard.applications.length
    ? Math.round((reviewedCount / dashboard.applications.length) * 100)
    : 0;
  const status = selected ? appStatus(selected.id) : "open";
  const industries = selected ? industryChips(selected.industries) : [];
  void draftTick;

  return (
    <div className="desk-page judge-desk judge-workbench-desk">
      <header className="judge-hero-slim">
        <div className="judge-hero-slim-copy">
          <p className="cc-eyebrow">Fuel · Judge desk</p>
          <h1>{dashboard.stage.name}</h1>
          <p className="judge-hero-slim-note">
            Signed in as {judgeName}.
            {dashboard.mode === "mock"
              ? " Sample applications. Nothing on this desk is written to Zoho."
              : dashboard.writesEnabled
                ? " Applications are read from Fuel CRM."
                : " Applications are read from Fuel CRM. Submitted reviews stay on this desk until CRM writes are on."}
          </p>
        </div>

        <div className="judge-hero-slim-tools">
          <div className="judge-progress-slim" aria-label="Your review progress">
            <div className="judge-progress-slim-meta">
              <strong>{reviewedCount}</strong>
              <span>of {dashboard.applications.length} reviewed</span>
              <em>{openCount} open</em>
            </div>
            <div className="judge-progress-slim-track" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="judge-queue-shell" ref={queueRef}>
            <button
              type="button"
              className={`judge-queue-toggle${queueOpen ? " is-open" : ""}`}
              aria-expanded={queueOpen}
              aria-controls="judge-app-queue"
              onClick={toggleQueue}
            >
              Applications
              <span aria-hidden="true">{queueOpen ? "▴" : "▾"}</span>
            </button>
            {queueOpen ? (
              <div id="judge-app-queue" className="judge-queue-drawer" role="dialog" aria-label="Applications for review">
                <div className="judge-queue-drawer-bar">
                  <label className="desk-search">
                    <span className="sr-only">Search applications</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, summary, or industry"
                      type="search"
                    />
                  </label>
                  <div className="desk-sort judge-sort">
                    <span>Sort</span>
                    <SortButton label="Project" sortKey="projectName" sort={sort} onSort={toggleSort} />
                    <SortButton label="Status" sortKey="stage" sort={sort} onSort={toggleSort} />
                    {columns.has("fundingRequested") ? (
                      <SortButton label="Funding" sortKey="fundingRequested" sort={sort} onSort={toggleSort} />
                    ) : null}
                    {columns.has("totalReviews") ? (
                      <SortButton label="Reviews" sortKey="totalReviews" sort={sort} onSort={toggleSort} />
                    ) : null}
                  </div>
                </div>
                {dashboard.applications.length === 0 ? (
                  <p className="desk-empty">No applications are in {dashboard.stage.statuses.join(" or ")}.</p>
                ) : rows.length === 0 ? (
                  <p className="desk-empty">No applications match that search.</p>
                ) : (
                  <ul className="judge-queue-list">
                    {rows.map((application) => {
                      const mine = appStatus(application.id);
                      const active = application.id === selectedId;
                      return (
                        <li key={application.id}>
                          <button
                            type="button"
                            className={`judge-queue-item${active ? " is-selected" : ""}`}
                            aria-current={active ? "true" : undefined}
                            onClick={() => selectApplication(application.id)}
                          >
                            <strong>{application.projectName}</strong>
                            <span className={`review-status status-${mine}`}>
                              {mine === "submitted" ? "Submitted" : mine === "draft" ? "Draft" : "Open"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="desk-keys">J / K or ← / → move through the queue when you are not typing.</p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {dashboard.syncing ? <p className="desk-note">CRM syncing</p> : null}

      {!selected ? (
        <p className="desk-empty judge-workbench-empty">Select an application to read it and start a review.</p>
      ) : (
        <div className="judge-workbench">
          <section className="judge-materials" aria-label="Application materials">
            <div className="judge-materials-head">
              <div>
                <p className="cc-eyebrow">
                  Application {selectedIndex >= 0 ? selectedIndex + 1 : "—"} of {rows.length}
                </p>
                <div className="judge-title-row">
                  <h2 className="judge-title">{selected.projectName}</h2>
                  <span className={`review-status status-${status}`}>
                    {status === "submitted" ? "Submitted" : status === "draft" ? "Draft" : "Open"}
                  </span>
                </div>
                <div className="judge-title-meta">
                  <span className="stage-chip tone-active">{selected.stage}</span>
                  <span className={pipelineChipClass(selected.pipeline)}>{pipelineLabel(selected.pipeline)}</span>
                </div>
              </div>
              <div className="read-move">
                <button className="btn-on-light" type="button" onClick={() => move(-1)} disabled={selectedIndex <= 0}>
                  Previous
                </button>
                <button
                  className="btn-on-light"
                  type="button"
                  onClick={() => move(1)}
                  disabled={selectedIndex < 0 || selectedIndex >= rows.length - 1}
                >
                  Next
                </button>
              </div>
            </div>

            <p className="judge-summary-line">
              {selected.summary || "No one-sentence summary is on this application."}
            </p>

            <div className="judge-fact-strip" aria-label="Key facts">
              {columns.has("fundingRequested") ? (
                <div>
                  <span>Funding</span>
                  <strong>{money(selected.fundingRequested)}</strong>
                </div>
              ) : null}
              <div>
                <span>Pipeline</span>
                <strong>
                  <span className={pipelineChipClass(selected.pipeline)}>{pipelineLabel(selected.pipeline)}</span>
                </strong>
              </div>
              {columns.has("industries") ? (
                <div className="judge-fact-industries">
                  <span>Industries</span>
                  <strong>
                    {industries.length ? (
                      <ul className="industry-chip-list">
                        {industries.slice(0, 4).map((chip) => (
                          <li key={chip} title={chip}>{chip}</li>
                        ))}
                        {industries.length > 4 ? <li className="is-more">+{industries.length - 4}</li> : null}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
              ) : null}
              {columns.has("totalReviews") ? (
                <div>
                  <span>Reviews</span>
                  <strong>{selected.totalReviews ?? "—"}</strong>
                </div>
              ) : null}
            </div>

            {materials.length ? (
              <section className="judge-docs judge-docs-workbench">
                <h3>Application materials</h3>
                <ul className="doc-action-list">
                  {materials.map(({ column, link }) => (
                    <li key={column} className={link ? "is-present" : "is-missing"}>
                      <span>{COLUMN_LABELS[column]}</span>
                      {link ? (
                        <a className="doc-open-btn" href={link.href} target="_blank" rel="noreferrer">
                          Open
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <em>Not provided</em>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {columns.has("initialFeedback") ? (
              <InitialJudgesFeedbackPanel applicationId={selected.id} workbench />
            ) : null}
          </section>

          <aside className="judge-score-pane" aria-label="Score and submit feedback">
            <form className="judge-form judge-form-elite judge-form-sticky" onSubmit={submitReview}>
              <div className="judge-form-head">
                <p className="cc-eyebrow">Your review · Step {formStep} of {FORM_STEPS[formId].length}</p>
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
                <WrittenForm
                  step={formStep}
                  draft={written}
                  judgeName={judgeName}
                  judgeEmail={judgeEmail}
                  projectName={selected.projectName}
                  onChange={setWritten}
                />
              ) : (
                <PitchForm
                  step={formStep}
                  draft={pitch}
                  judgeName={judgeName}
                  judgeEmail={judgeEmail}
                  projectName={selected.projectName}
                  onChange={setPitch}
                />
              )}
              <div className="judge-form-actions">
                {formStep > 1 ? (
                  <button className="btn-on-light" type="button" onClick={() => setFormStep((step) => step - 1)}>
                    Back
                  </button>
                ) : (
                  <span />
                )}
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
                  <button className="btn" type="submit" disabled={busy}>
                    {busy ? "Submitting…" : formId === "pitch" ? "Submit recommendation" : "Submit review"}
                  </button>
                )}
              </div>
              {error ? <p className="form-note" role="alert">{error}</p> : null}
              {message ? <p className="form-note" role="status">{message}</p> : null}
              {payloadPreview ? (
                <details className="payload-preview" open={adminView}>
                  <summary>{adminView ? "Payload preview" : "Dry-run payload"}</summary>
                  <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
                </details>
              ) : null}
            </form>
          </aside>
        </div>
      )}
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
        <h3>Ratings and feedback</h3>
        <p className="field-help">
          Score each rubric question 1–5. Labels match the initial judges&apos; feedback on the left so you can cross-reference while scoring.
        </p>
        <ul className="scale-legend scale-legend-inline">
          {RATING_SCALE.map((option) => (
            <li key={option.value}>
              <strong>{option.value}</strong> {option.label}
            </li>
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
        <p className="field-help">
          Use the anonymized initial judges&apos; feedback on the left (same rubric question order) while writing your pitch notes.
        </p>
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
