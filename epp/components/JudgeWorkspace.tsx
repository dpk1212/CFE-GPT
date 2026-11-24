"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function cellValue(application: FuelApplication, column: FuelColumnId) {
  switch (column) {
    case "totalReviews":
      return application.totalReviews == null ? "—" : String(application.totalReviews);
    case "projectName":
      return application.projectName;
    case "summary":
      return application.summary || "—";
    case "industries":
      return application.industries || "—";
    case "fundingRequested":
      return money(application.fundingRequested);
    case "initialFeedback":
      return application.initialFeedback.length ? application.initialFeedback.join("\n\n") : "—";
    default:
      return null;
  }
}

function linkFor(application: FuelApplication, column: FuelColumnId): { href: string; label: string } | null {
  switch (column) {
    case "fuelApplication":
      return application.fuelApplicationUrl
        ? { href: application.fuelApplicationUrl, label: "Application" }
        : null;
    case "budgetUrl":
      return application.budgetUrl ? { href: application.budgetUrl, label: "Budget" } : null;
    case "quadChart":
      return application.quadChartUrl ? { href: application.quadChartUrl, label: "Quad chart" } : null;
    case "technicalEvidence":
      return application.technicalEvidenceUrl
        ? { href: application.technicalEvidenceUrl, label: "Evidence" }
        : null;
    case "traction":
      return application.tractionUrl ? { href: application.tractionUrl, label: "Traction" } : null;
    case "images":
      return application.imagesUrl ? { href: application.imagesUrl, label: "Images" } : null;
    case "pitchDeck":
      return application.pitchDeckUrl ? { href: application.pitchDeckUrl, label: "Deck" } : null;
    case "video":
      return application.videoUrl ? { href: application.videoUrl, label: "Video" } : null;
    case "additional":
      return application.additionalUrl ? { href: application.additionalUrl, label: "File" } : null;
    default:
      return null;
  }
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/judge/dashboard");
      const body = (await response.json().catch(() => null)) as (DashboardPayload & { error?: string }) | null;
      if (cancelled) return;
      if (!response.ok || !body || body.error) {
        setLoadError(body?.error ?? "The Fuel desk could not be loaded.");
        return;
      }
      setDashboard(body);
      setSelectedId(body.applications[0]?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => dashboard?.applications.find((row) => row.id === selectedId) ?? null,
    [dashboard, selectedId],
  );

  function selectApplication(id: string) {
    setSelectedId(id);
    setFormStep(1);
    setWritten(blankWritten());
    setPitch(blankPitch());
    setMessage("");
    setError("");
    setPayloadPreview(null);
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!dashboard || !selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    setPayloadPreview(null);
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
    if (body?.wrote) {
      setMessage(`Review submitted for ${body.project}.`);
    } else {
      setMessage(
        `Review recorded for ${body?.project ?? selected.projectName}. CRM writes are off — this is a dry run of the Application_Review payload.`,
      );
      setPayloadPreview(body?.record ?? null);
    }
    setFormStep(1);
    setWritten(blankWritten());
    setPitch(blankPitch());
  }

  if (loadError) {
    return (
      <div className="judge-shell">
        <p className="form-note" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="judge-shell">
        <p className="quiet">Loading the Fuel review desk…</p>
      </div>
    );
  }

  const formId: FuelFormId = dashboard.stage.form;
  const stepLabels = FORM_STEPS[formId];

  return (
    <div className="judge-shell">
      <header className="judge-banner">
        <div className="judge-brand">
          <p className="fuel-mark">
            <span>Fuel</span> Funding Student Ventures
          </p>
          <h1>{dashboard.stage.name}</h1>
          <p className="judge-lede">
            Signed in as {judgeName} · {judgeEmail}. Select an application on the left, complete the
            review on the right, and submit.
          </p>
        </div>
        <div className="judge-meta">
          <strong>M | CFE</strong>
          <span>{dashboard.mode === "live" ? "Live CRM read" : "Sample catalog"}</span>
          <span>{dashboard.writesEnabled ? "CRM writes on" : "Dry-run submissions"}</span>
        </div>
      </header>
      <p className="judge-source">
        {dashboard.mode === "mock"
          ? "Sample applications are on screen so the review desk can be used before Fuel CRM credentials are connected. Nothing on this screen is written to Zoho."
          : dashboard.writesEnabled
            ? "Applications are read from Fuel CRM. Submitting a review writes an Application Review."
            : "Applications are read from Fuel CRM. Submitting a review stays in the EPP store until CRM writes are turned on."}
      </p>

      <div className="judge-split">
        <section className="judge-table-panel" aria-label="Applications for review">
          <div className="judge-table-head">
            <h2>Fuel Applications for Review</h2>
            <p>
              {dashboard.applications.length}{" "}
              {dashboard.applications.length === 1 ? "application" : "applications"} in this stage
            </p>
          </div>
          <div className="judge-table-wrap">
            <table className="judge-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {dashboard.stage.columns.map((column) => (
                    <th key={column}>{COLUMN_LABELS[column]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.applications.length === 0 ? (
                  <tr>
                    <td colSpan={dashboard.stage.columns.length + 1}>No applications match this stage.</td>
                  </tr>
                ) : (
                  dashboard.applications.map((application, index) => (
                    <tr
                      key={application.id}
                      className={application.id === selectedId ? "is-selected" : undefined}
                      onClick={() => selectApplication(application.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectApplication(application.id);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td>{index + 1}</td>
                      {dashboard.stage.columns.map((column) => {
                        const link = linkFor(application, column);
                        const text = cellValue(application, column);
                        return (
                          <td key={column}>
                            {link ? (
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {link.label}
                              </a>
                            ) : column === "initialFeedback" ? (
                              <span className="feedback-cell">
                                {application.initialFeedback.length
                                  ? text
                                  : "No stage 1 feedback yet"}
                              </span>
                            ) : (
                              text
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="judge-form-panel" aria-label="Review form">
          {!selected ? (
            <p className="quiet form-empty">Select an application to begin a review.</p>
          ) : (
            <form className="judge-form" onSubmit={submitReview}>
              <div className="judge-form-head">
                <p className="eyebrow dark">Fuel application review</p>
                <h2>{selected.projectName}</h2>
                <p className="quiet">{selected.summary}</p>
                <ol className="form-steps" aria-label="Review steps">
                  {stepLabels.map((label, index) => {
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
                  <button className="btn-line" type="button" onClick={() => setFormStep((step) => step - 1)}>
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {formStep < 3 ? (
                  <button
                    className="btn-maize-border"
                    type="button"
                    onClick={() => {
                      if (formStep === 1) {
                        if (formId === "written" && !written.conflict) {
                          setError("Choose whether you have a conflict of interest.");
                          return;
                        }
                        if (!(formId === "written" ? written.confidentiality : pitch.confidentiality)) {
                          setError("The confidentiality agreement is required.");
                          return;
                        }
                      }
                      if (formStep === 2 && formId === "written") {
                        if (Object.values(written.ratings).some((value) => !value)) {
                          setError("Each category needs a rating from 1 to 5.");
                          return;
                        }
                      }
                      setError("");
                      setFormStep((step) => step + 1);
                    }}
                  >
                    Continue
                  </button>
                ) : (
                  <button className="btn-maize-border" type="submit" disabled={busy}>
                    {busy ? "Submitting…" : formId === "pitch" ? "Submit recommendation" : "Submit review"}
                  </button>
                )}
              </div>
              {error ? (
                <p className="form-note" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="form-note success" role="status">
                  {message}
                </p>
              ) : null}
              {payloadPreview ? (
                <details className="payload-preview" open>
                  <summary>Application_Review payload (dry run)</summary>
                  <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
                </details>
              ) : null}
            </form>
          )}
        </section>
      </div>
    </div>
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
      <h3>Judge&apos;s contact info</h3>
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
        <legend>Conflict of interest?{conflictRequired ? "" : " (optional)"}</legend>
        <p className="field-help">
          Do you think you have a conflict of interest with this project? If so, please contact Alison
          Smith, <a href="mailto:alisone@umich.edu">alisone@umich.edu</a>.
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
          <input
            type="checkbox"
            checked={confidentiality}
            onChange={(event) => onConfidentiality(event.target.checked)}
            required
          />
          <span>
            I agree to maintain the confidentiality of all information related to the students&apos;
            ventures presented during the Fuel program.
          </span>
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
        <div className="scale-legend">
          <p>Rate each category from 1 to 5.</p>
          <ul>
            {RATING_SCALE.map((option) => (
              <li key={option.value}>
                <strong>{option.value}</strong> {option.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="rubric-list">
          {WRITTEN_RUBRIC.map((item) => (
            <fieldset key={item.key} className="rubric-card">
              <legend>{item.title}</legend>
              <p className="field-help">{item.hint}</p>
              <p className="field-help consider">Judges, please consider: {item.consider}</p>
              <div className="rating-row">
                {RATING_SCALE.map((option) => (
                  <label key={option.value} className={draft.ratings[item.key] === option.value ? "on" : undefined}>
                    <input
                      type="radio"
                      name={`rating-${item.key}`}
                      checked={draft.ratings[item.key] === option.value}
                      onChange={() =>
                        onChange({
                          ...draft,
                          ratings: { ...draft.ratings, [item.key]: option.value },
                        })
                      }
                    />
                    <strong>{option.value}</strong>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <label>
                Optional feedback
                <textarea
                  rows={3}
                  value={draft.feedback[item.key] ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      feedback: { ...draft.feedback, [item.key]: event.target.value },
                    })
                  }
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
        Strengths &amp; highlights
        <textarea
          rows={4}
          placeholder="What are the strongest elements of this application or venture?"
          value={draft.strengths}
          onChange={(event) => onChange({ ...draft, strengths: event.target.value })}
        />
        <span className="field-help">Your feedback is provided anonymously to the applicant(s).</span>
      </label>
      <label>
        Areas for improvement
        <textarea
          rows={4}
          placeholder="What core areas need the most improvement? Identify specific gaps and the key open questions before pitching."
          value={draft.improvements}
          onChange={(event) => onChange({ ...draft, improvements: event.target.value })}
        />
        <span className="field-help">Your feedback is provided anonymously to the applicant(s).</span>
      </label>
      <fieldset className="choice-set">
        <legend>
          Should this team advance to presenting this month, where they will have the opportunity to
          receive a funding award?
        </legend>
        <label className="radio-line">
          <input
            type="radio"
            name="advance"
            checked={draft.advance === "yes"}
            onChange={() => onChange({ ...draft, advance: "yes" })}
          />
          Yes, this team/project should advance
        </label>
        <label className="radio-line">
          <input
            type="radio"
            name="advance"
            checked={draft.advance === "no"}
            onChange={() => onChange({ ...draft, advance: "no" })}
          />
          No, this team has more work to do
        </label>
      </fieldset>
      <label>
        Do you know a good coach or contact for this team?
        <textarea
          rows={3}
          value={draft.coach}
          onChange={(event) => onChange({ ...draft, coach: event.target.value })}
        />
      </label>
      <label>
        Internal notes
        <span className="field-help">Not shown to applicants.</span>
        <textarea
          rows={3}
          value={draft.internalNotes}
          onChange={(event) => onChange({ ...draft, internalNotes: event.target.value })}
        />
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
          <textarea
            rows={4}
            value={draft.didWell}
            onChange={(event) => onChange({ ...draft, didWell: event.target.value })}
          />
        </label>
        <label>
          What should this team prioritize to improve their business plan, their pitch, or anything else
          about their venture?
          <textarea
            rows={4}
            value={draft.prioritize}
            onChange={(event) => onChange({ ...draft, prioritize: event.target.value })}
          />
        </label>
        <label>
          Do you know someone who would be a good coach or contact for this team?
          <span className="field-help">
            If yes, contact information is appreciated and will be passed on to the student team. If you
            already provided this information during the written application reviews, no need to
            duplicate.
          </span>
          <textarea
            rows={3}
            value={draft.coach}
            onChange={(event) => onChange({ ...draft, coach: event.target.value })}
          />
        </label>
      </div>
    );
  }
  return (
    <div className="form-page">
      <h3>CFE Direct Support</h3>
      <fieldset className="choice-set">
        <legend>Should this team receive Fuel funding?</legend>
        <label className="radio-line">
          <input
            type="radio"
            name="funding"
            checked={draft.funding === "yes"}
            onChange={() => onChange({ ...draft, funding: "yes" })}
            required
          />
          Yes
        </label>
        <label className="radio-line">
          <input
            type="radio"
            name="funding"
            checked={draft.funding === "no"}
            onChange={() => onChange({ ...draft, funding: "no" })}
          />
          No, not at this time
        </label>
      </fieldset>
      <label>
        Internal notes
        <span className="field-help">
          These notes are kept internal to the CFE Fuel staff. You may mention which milestones should
          be funded, or a minimum or maximum amount of funding, etc.
        </span>
        <textarea
          rows={4}
          value={draft.internalNotes}
          onChange={(event) => onChange({ ...draft, internalNotes: event.target.value })}
        />
      </label>
    </div>
  );
}
