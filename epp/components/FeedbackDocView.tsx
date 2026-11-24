"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RUBRIC_URL,
  type FeedbackComment,
  type FeedbackDocument,
  type FeedbackQuestion,
  type FeedbackRound,
  type FeedbackScoreChip,
} from "@/lib/fuelFeedback/types";
import { useFeedbackDocument } from "@/lib/fuelFeedback/useFeedbackDocument";
import { RATING_SCALE } from "@/lib/fuelJudge/columns";

type Step =
  | { kind: "question"; question: FeedbackQuestion }
  | { kind: "strengths"; comments: FeedbackComment[] }
  | { kind: "improvements"; comments: FeedbackComment[] };

const SHORT_QUESTION: Record<string, string> = {
  problem: "Problem",
  solution: "Solution",
  market: "Market",
  freedom: "Freedom",
  execution: "Execution",
  team: "Team",
};

function shortQuestionName(question: FeedbackQuestion) {
  return SHORT_QUESTION[question.id] || question.title.split(/[&/]/)[0]?.trim() || question.title;
}

export function FeedbackDocView({
  applicationId,
  compact = false,
  workbench = false,
  document: preloaded,
  loading: preloadedLoading,
  error: preloadedError,
  preferredRoundId,
}: {
  applicationId: string;
  compact?: boolean;
  workbench?: boolean;
  document?: FeedbackDocument | null;
  loading?: boolean;
  error?: string;
  preferredRoundId?: string | null;
}) {
  const fetched = useFeedbackDocument(preloaded === undefined ? applicationId : null);
  const doc = preloaded !== undefined ? preloaded : fetched.doc;
  const loading = preloaded !== undefined ? Boolean(preloadedLoading) : fetched.loading;
  const error = preloaded !== undefined ? (preloadedError || "") : fetched.error;
  const [roundId, setRoundId] = useState("");

  useEffect(() => {
    if (!doc) {
      setRoundId("");
      return;
    }
    if (preferredRoundId && doc.rounds.some((round) => round.id === preferredRoundId)) {
      setRoundId(preferredRoundId);
      return;
    }
    setRoundId(doc.rounds[0]?.id || "");
  }, [doc, preferredRoundId]);

  if (loading) return <p className="quiet">Loading judge feedback…</p>;
  if (error) return <p className="form-note" role="alert">{error}</p>;
  if (!doc) return null;

  const active = doc.rounds.find((round) => round.id === roundId) || doc.rounds[0] || null;
  const pdfHref = `/api/feedback/${encodeURIComponent(applicationId)}/pdf`;

  if (workbench) {
    return (
      <div className="feedback-doc is-compact is-workbench">
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
          <RoundStepper
            round={active}
            pdfHref={pdfHref}
            reviewCount={active.reviewCount}
            omittedConflict={doc.omittedConflict}
            warning={doc.warning}
          />
        ) : (
          <p className="app-empty-feedback">No judge reviews yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`feedback-doc${compact ? " is-compact" : ""}`}>
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

      {active ? <RoundScrollView round={active} /> : (
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

function scoreHistogram(chips: FeedbackScoreChip[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const chip of chips) {
    if (chip.value == null || chip.value < 1 || chip.value > 5) continue;
    counts[chip.value - 1] += 1;
  }
  const max = Math.max(1, ...counts);
  return counts.map((count, index) => ({
    score: index + 1,
    count,
    height: Math.round((count / max) * 100),
  }));
}

function RoundStepper({
  round,
  pdfHref,
  reviewCount,
  omittedConflict,
  warning,
}: {
  round: FeedbackRound;
  pdfHref: string;
  reviewCount: number;
  omittedConflict: number;
  warning?: string;
}) {
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

  return (
    <div
      className="feedback-stepper feedback-stepper-elite"
      ref={regionRef}
      tabIndex={0}
      aria-label="Initial judges' feedback by question"
    >
      <header className="feedback-elite-band">
        <div className="feedback-elite-band-copy">
          <p className="feedback-elite-kicker">Anonymized · Rubric order</p>
          <h3>Initial judges&apos; feedback</h3>
          <p className="feedback-elite-count">
            <strong>{reviewCount}</strong>
            {" "}
            anonymized review{reviewCount === 1 ? "" : "s"}
            {omittedConflict ? ` · ${omittedConflict} conflict omitted` : ""}
          </p>
        </div>
        <div className="feedback-elite-band-actions">
          <details className="feedback-scale-tip">
            <summary>Scale</summary>
            <ul>
              {RATING_SCALE.map((option) => (
                <li key={option.value}>
                  <strong>{option.value}</strong> {option.label}
                </li>
              ))}
            </ul>
          </details>
          <a className="btn-on-dark" href={pdfHref}>PDF</a>
          <a className="btn-on-dark" href={RUBRIC_URL} target="_blank" rel="noreferrer">
            Rubric
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        {warning ? <p className="feedback-elite-warning">{warning}</p> : null}
      </header>

      <div className="feedback-q-nav" role="tablist" aria-label="Feedback pages">
        <button
          className="btn-on-light feedback-q-nav-edge"
          type="button"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={safeIndex <= 0}
        >
          Back
        </button>
        <div className="feedback-q-nav-track">
          {steps.map((item, stepIndex) => {
            const active = stepIndex === safeIndex;
            if (item.kind === "question") {
              const avg = item.question.average;
              const meter = avg == null ? 0 : Math.max(8, Math.round((avg / 5) * 100));
              return (
                <button
                  key={`${item.kind}-${item.question.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`feedback-q-seg${active ? " on" : ""}`}
                  onClick={() => setIndex(stepIndex)}
                >
                  <span className="feedback-q-seg-top">
                    <em>Q{stepIndex + 1}</em>
                    <strong>{shortQuestionName(item.question)}</strong>
                  </span>
                  <span className="feedback-q-seg-avg">{avg ?? "—"}</span>
                  <span className="feedback-q-meter" aria-hidden="true">
                    <i style={{ width: `${meter}%` }} />
                  </span>
                </button>
              );
            }
            const label = item.kind === "strengths" ? "Strengths" : "Improve";
            return (
              <button
                key={`${item.kind}-${stepIndex}`}
                type="button"
                role="tab"
                aria-selected={active}
                className={`feedback-q-seg is-text${active ? " on" : ""}`}
                onClick={() => setIndex(stepIndex)}
              >
                <span className="feedback-q-seg-top">
                  <em>{stepIndex + 1}/{steps.length}</em>
                  <strong>{label}</strong>
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="btn-on-light feedback-q-nav-edge"
          type="button"
          onClick={() => setIndex((value) => Math.min(steps.length - 1, value + 1))}
          disabled={safeIndex >= steps.length - 1}
        >
          Next
        </button>
      </div>
      <p className="feedback-q-nav-status" aria-live="polite">
        {safeIndex + 1} of {steps.length}
      </p>

      <StepPage step={step} />
    </div>
  );
}

function StepPage({ step }: { step: Step }) {
  if (step.kind === "question") {
    const question = step.question;
    const histogram = scoreHistogram(question.chips);
    const scoreByJudge = new Map(
      question.chips.filter((chip) => chip.value != null).map((chip) => [chip.judge, chip]),
    );

    return (
      <section className="feedback-step-page" aria-label={question.title}>
        <div className="feedback-step-head">
          <h4>{question.title}</h4>
          <div className="feedback-step-side">
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
            <div className="feedback-hist" aria-label="Score distribution">
              {histogram.map((bar) => (
                <div key={bar.score} className="feedback-hist-bar" title={`${bar.count} at ${bar.score}`}>
                  <span style={{ height: `${Math.max(bar.count ? 12 : 4, bar.height * 0.36)}px` }} />
                  <em>{bar.score}</em>
                </div>
              ))}
            </div>
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
            <CommentCard
              key={`${question.id}-${comment.judge}-${comment.text.slice(0, 24)}`}
              comment={comment}
              chip={scoreByJudge.get(comment.judge)}
            />
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
          <CommentCard key={`${step.kind}-${comment.judge}-${comment.text.slice(0, 24)}`} comment={comment} />
        ))
      ) : (
        <p className="quiet">{empty}</p>
      )}
    </section>
  );
}

function CommentCard({
  comment,
  chip,
}: {
  comment: FeedbackComment;
  chip?: FeedbackScoreChip;
}) {
  return (
    <article className="feedback-comment-card">
      <header>
        <span className="feedback-comment-judge">{comment.judge}</span>
        {chip?.value != null ? (
          <span className="feedback-comment-score" title={chip.label}>
            {chip.value}
          </span>
        ) : null}
      </header>
      <p>{comment.text}</p>
    </article>
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

      {round.questions.map((question) => {
        const scoreByJudge = new Map(
          question.chips.filter((chip) => chip.value != null).map((chip) => [chip.judge, chip]),
        );
        return (
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
              <CommentCard
                key={`${question.id}-${comment.judge}-${comment.text.slice(0, 24)}`}
                comment={comment}
                chip={scoreByJudge.get(comment.judge)}
              />
            ))}
          </section>
        );
      })}

      <section className="feedback-doc-question">
        <div className="doc-head">
          <h4>Key Strengths</h4>
        </div>
        {round.strengths.length ? (
          round.strengths.map((comment) => (
            <CommentCard key={`s-${comment.judge}-${comment.text.slice(0, 24)}`} comment={comment} />
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
            <CommentCard key={`i-${comment.judge}-${comment.text.slice(0, 24)}`} comment={comment} />
          ))
        ) : (
          <p className="quiet">No improvement notes were recorded in this round.</p>
        )}
      </section>
    </div>
  );
}
