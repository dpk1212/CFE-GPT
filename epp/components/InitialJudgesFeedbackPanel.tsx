"use client";

import { useEffect, useState } from "react";
import { FeedbackDocView } from "@/components/FeedbackDocView";
import type { FeedbackDocument } from "@/lib/fuelFeedback/types";

const STORAGE_KEY = "epp-initial-judges-feedback-open";

export function InitialJudgesFeedbackPanel({
  applicationId,
  workbench = false,
  document,
  loading,
  error,
  preferredRoundId,
}: {
  applicationId: string;
  workbench?: boolean;
  document?: FeedbackDocument | null;
  loading?: boolean;
  error?: string;
  preferredRoundId?: string | null;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "0") setOpen(false);
    if (stored === "1") setOpen(true);
  }, []);

  function toggle() {
    setOpen((value) => {
      const next = !value;
      sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <section
      className={`initial-judges-feedback${open ? " is-open" : ""}${workbench ? " is-workbench is-elite" : ""}`}
      aria-label="Initial judges' feedback"
    >
      {workbench ? null : (
        <button
          type="button"
          className="initial-judges-feedback-toggle"
          onClick={toggle}
          aria-expanded={open}
        >
          <span className="initial-judges-feedback-kicker">Anonymized · Rubric order</span>
          <span className="initial-judges-feedback-label">Initial judges&apos; feedback</span>
          <span className="initial-judges-feedback-action">{open ? "Minimize" : "Expand"}</span>
        </button>
      )}
      {workbench ? (
        <div className="initial-judges-feedback-elite-shell">
          <button
            type="button"
            className="initial-judges-feedback-minimize"
            onClick={toggle}
            aria-expanded={open}
          >
            {open ? "Minimize" : "Expand initial judges' feedback"}
          </button>
          {open ? (
            <FeedbackDocView
              applicationId={applicationId}
              compact
              workbench
              document={document}
              loading={loading}
              error={error}
              preferredRoundId={preferredRoundId}
            />
          ) : null}
        </div>
      ) : open ? (
        <div className="initial-judges-feedback-body">
          <FeedbackDocView
            applicationId={applicationId}
            compact
            document={document}
            loading={loading}
            error={error}
            preferredRoundId={preferredRoundId}
          />
        </div>
      ) : null}
    </section>
  );
}
