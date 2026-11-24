"use client";

import { useEffect, useState } from "react";
import { RUBRIC_URL, type FeedbackDocument, type FeedbackRound } from "@/lib/fuelFeedback/types";

export function FeedbackDocView({
  applicationId,
  compact = false,
}: {
  applicationId: string;
  compact?: boolean;
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
          <a className="btn-line" href={RUBRIC_URL} target="_blank" rel="noreferrer">
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

      {active ? <RoundView round={active} /> : (
        <p className="app-empty-feedback">No eligible judge reviews are linked to this application yet.</p>
      )}
    </div>
  );
}

function RoundView({ round }: { round: FeedbackRound }) {
  return (
    <div className="feedback-doc-round">
      <p className="quiet">
        {round.reviewCount} anonymized review{round.reviewCount === 1 ? "" : "s"}
        {round.questions.some((q) => q.average != null)
          ? ` · question averages ${round.questions.filter((q) => q.average != null).map((q) => q.average).join(" · ")}`
          : ""}
      </p>

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
