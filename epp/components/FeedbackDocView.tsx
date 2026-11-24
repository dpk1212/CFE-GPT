"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RUBRIC_URL,
  type FeedbackComment,
  type FeedbackDocument,
  type FeedbackQuestion,
  type FeedbackRound,
} from "@/lib/fuelFeedback/types";

type Step =
  | { kind: "question"; question: FeedbackQuestion }
  | { kind: "strengths"; comments: FeedbackComment[] }
  | { kind: "improvements"; comments: FeedbackComment[] };

export function FeedbackDocView({
  applicationId,
  compact = false,
  workbench = false,
}: {
  applicationId: string;
  compact?: boolean;
  workbench?: boolean;
}) {
  const [doc, setDoc] = useState<FeedbackDocument | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [roundId, setRoundId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setDoc(null);
    fetch(`/api/feedback/${encodeURIComponent(applicationId)}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as FeedbackDocument & { error?: string } | null;
        if (cancelled) return;
        if (!response.ok || !body || body.error) {
          setError(body?.error || "Judge feedback could not be loaded.");
          return;
        }
        setDoc(body);
        setRoundId(body.rounds[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setError("Judge feedback could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (loading) return <p className="quiet">Loading judge feedback…</p>;
  if (error) return <p className="form-note" role="alert">{error}</p>;
  if (!doc) return null;

  const active = doc.rounds.find((round) => round.id === roundId) || doc.rounds[0] || null;
  const pdfHref = `/api/feedback/${encodeURIComponent(applicationId)}/pdf`;

  return (
    <div className={`feedback-doc${compact ? " is-compact" : ""}${workbench ? " is-workbench" : ""}`}>
      {workbench ? (
        <header className="feedback-doc-workbench-meta">
          <p className="feedback-doc-workbench-count">
            <strong>{doc.reviewCount}</strong> anonymized review{doc.reviewCount === 1 ? "" : "s"}
            {doc.omittedConflict ? ` · ${doc.omittedConflict} conflict omitted` : ""}
          </p>
          <div className="feedback-doc-actions">
            <a className="btn-on-light" href={pdfHref}>PDF</a>
            <a className="btn-on-light" href={RUBRIC_URL} target="_blank" rel="noreferrer">
              Rubric
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          {doc.warning ? <p className="quiet">{doc.warning}</p> : null}
        </header>
      ) : (
        <header className="feedback-doc-cover">
          <p className="cc-eyebrow">Center for Entrepreneurship · Fuel</p>
          <h3>Judge&apos;s Feedback</h3>
          <p className="feedback-doc-project">{doc.projectName}</p>
          {doc.summary ? <p className="feedback-doc-summary">{doc.summary}</p> : null}
          <div className="feedback-doc-meta">
            <span>{doc.reviewCount} review{doc.reviewCount === 1 ? "" : "s"}</span>
            {doc.omittedConflict ? <span>{doc.omittedConflict} conflict omitted</span> : null}
            {doc.rounds.map((round) => (
              <span key={round.id}>{round.label}: {round.reviewCount}</span>
            ))}
          </div>
          <div className="feedback-doc-actions">
            <a className="btn" href={pdfHref}>Download PDF</a>
            <a className="btn-on-dark" href={RUBRIC_URL} target="_blank" rel="noreferrer">
              Rubric
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          {doc.warning ? <p className="quiet">{doc.warning}</p> : null}
        </header>
      )}

      {doc.rounds.length > 1 ? (
        <div className="feedback-doc-tabs" role="tablist" aria-label="Feedback rounds">
          {doc.rounds.map((round) => (
            <button
              key={round.id}
              type="button"
              role="tab"
              aria-selected={active?.id === round.id}
              className={active?.id === round.id ? "on" : undefined}
              onClick={() => setRoundId(round.id)}
            >
              {round.label}
            </button>
          ))}
        </div>
      ) : null}

      {active ? (
        workbench ? <RoundStepper round={active} /> : <RoundScrollView round={active} />
      ) : (
        <p className="app-empty-feedback">No judge reviews yet.</p>
      )}
    </div>
  );
}

function buildSteps(round: FeedbackRound): Step[] {
  return [
    ...round.questions.map((question) => ({ kind: "question" as const, question })),
    { kind: "strengths" as const, comments: round.strengths },
    { kind: "improvements" as const, comments: round.improvements },
  ];
}

function RoundStepper({ round }: { round: FeedbackRound }) {
  const steps = useMemo(() => buildSteps(round), [round]);
  const [index, setIndex] = useState(0);
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [round.id]);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (!node?.contains(document.activeElement) && !node?.contains(target)) return;
      event.preventDefault();
      event.stopPropagation();
      setIndex((current) => {
        if (event.key === "ArrowLeft") return Math.max(0, current - 1);
        return Math.min(steps.length - 1, current + 1);
      });
    }

    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [steps.length]);

  const safeIndex = Math.min(index, Math.max(0, steps.length - 1));
  const step = steps[safeIndex];
  if (!step) return <p className="app-empty-feedback">No judge reviews yet.</p>;

  const scored = round.questions.filter((question) => question.average != null);

  return (
    <div
      className="feedback-stepper"
      ref={regionRef}
      tabIndex={0}
      aria-label="Initial judges' feedback by question"
    >
      {scored.length ? (
        <ul className="feedback-avg-strip" aria-label="Question averages">
          {round.questions.map((question, questionIndex) => (
            <li key={question.id}>
              <button
                type="button"
                className={step.kind === "question" && step.question.id === question.id ? "on" : undefined}
                onClick={() => setIndex(questionIndex)}
              >
                <em>Q{questionIndex + 1}</em>
                <strong>{question.average ?? "—"}</strong>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="feedback-stepper-nav">
        <div className="read-move feedback-step-move">
          <button
            className="btn-on-light"
            type="button"
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={safeIndex <= 0}
          >
            Back
          </button>
          <button
            className="btn-on-light"
            type="button"
            onClick={() => setIndex((value) => Math.min(steps.length - 1, value + 1))}
            disabled={safeIndex >= steps.length - 1}
          >
            Next
          </button>
        </div>
        <p className="feedback-step-count" aria-live="polite">
          {safeIndex + 1} of {steps.length}
        </p>
        <div className="feedback-step-dots" role="tablist" aria-label="Feedback pages">
          {steps.map((item, stepIndex) => {
            const label =
              item.kind === "question"
                ? item.question.title
                : item.kind === "strengths"
                  ? "Key Strengths"
                  : "Room for Improvement";
            return (
              <button
                key={`${item.kind}-${stepIndex}`}
                type="button"
                role="tab"
                aria-label={`${label} (${stepIndex + 1} of ${steps.length})`}
                aria-selected={stepIndex === safeIndex}
                className={stepIndex === safeIndex ? "on" : undefined}
                onClick={() => setIndex(stepIndex)}
              />
            );
          })}
        </div>
      </div>

      <StepPage step={step} />
    </div>
  );
}

function StepPage({ step }: { step: Step }) {
  if (step.kind === "question") {
    const question = step.question;
    return (
      <section className="feedback-step-page" aria-label={question.title}>
        <div className="feedback-step-head">
          <h4>{question.title}</h4>
          <div className="feedback-step-stats">
            <span>
              <em>Avg</em>
              <strong>{question.average ?? "—"}</strong>
            </span>
            <span>
              <em>Spread</em>
              <strong>{question.spread}</strong>
            </span>
          </div>
        </div>
        {question.chips.length ? (
          <ul className="feedback-score-chips">
            {question.chips.map((chip) => (
              <li key={`${question.id}-${chip.judge}`}>
                <strong>{chip.judge}</strong>
                <span>{chip.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {question.comments.length ? (
          question.comments.map((comment) => (
            <article key={`${question.id}-${comment.judge}-${comment.text.slice(0, 24)}`} className="feedback-comment-card">
              <header>{comment.judge}</header>
              <p>{comment.text}</p>
            </article>
          ))
        ) : (
          <p className="quiet">No comments for this question.</p>
        )}
      </section>
    );
  }

  const title = step.kind === "strengths" ? "Key Strengths" : "Room for Improvement";
  const empty =
    step.kind === "strengths"
      ? "No strengths were recorded in this round."
      : "No improvement notes were recorded in this round.";

  return (
    <section className="feedback-step-page" aria-label={title}>
      <div className="feedback-step-head">
        <h4>{title}</h4>
      </div>
      {step.comments.length ? (
        step.comments.map((comment) => (
          <article key={`${step.kind}-${comment.judge}-${comment.text.slice(0, 24)}`} className="feedback-comment-card">
            <header>{comment.judge}</header>
            <p>{comment.text}</p>
          </article>
        ))
      ) : (
        <p className="quiet">{empty}</p>
      )}
    </section>
  );
}

function RoundScrollView({ round }: { round: FeedbackRound }) {
  const scored = round.questions.filter((question) => question.average != null);

  return (
    <div className="feedback-doc-round">
      {scored.length ? (
        <ul className="feedback-avg-strip" aria-label="Question averages">
          {round.questions.map((question, questionIndex) => (
            <li key={question.id}>
              <span>
                <em>Q{questionIndex + 1}</em>
                <strong>{question.average ?? "—"}</strong>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="quiet">
          {round.reviewCount} anonymized review{round.reviewCount === 1 ? "" : "s"}
        </p>
      )}

      {round.questions.map((question) => (
        <section key={question.id} className="feedback-doc-question">
          <div className="doc-head">
            <h4>{question.title}</h4>
            <span>avg {question.average ?? "—"} · spread {question.spread}</span>
          </div>
          {question.chips.length ? (
            <ul className="feedback-score-chips">
              {question.chips.map((chip) => (
                <li key={`${question.id}-${chip.judge}`}>
                  <strong>{chip.judge}</strong>
                  <span>{chip.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {question.comments.map((comment) => (
            <article key={`${question.id}-${comment.judge}-${comment.text.slice(0, 24)}`} className="feedback-comment-card">
              <header>{comment.judge}</header>
              <p>{comment.text}</p>
            </article>
          ))}
        </section>
      ))}

      <section className="feedback-doc-question">
        <div className="doc-head">
          <h4>Key Strengths</h4>
        </div>
        {round.strengths.length ? (
          round.strengths.map((comment) => (
            <article key={`s-${comment.judge}-${comment.text.slice(0, 24)}`} className="feedback-comment-card">
              <header>{comment.judge}</header>
              <p>{comment.text}</p>
            </article>
          ))
        ) : (
          <p className="quiet">No strengths were recorded in this round.</p>
        )}
      </section>

      <section className="feedback-doc-question">
        <div className="doc-head">
          <h4>Room for Improvement</h4>
        </div>
        {round.improvements.length ? (
          round.improvements.map((comment) => (
            <article key={`i-${comment.judge}-${comment.text.slice(0, 24)}`} className="feedback-comment-card">
              <header>{comment.judge}</header>
              <p>{comment.text}</p>
            </article>
          ))
        ) : (
          <p className="quiet">No improvement notes were recorded in this round.</p>
        )}
      </section>
    </div>
  );
}
