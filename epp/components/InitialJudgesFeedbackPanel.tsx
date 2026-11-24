"use client";

import { useEffect, useState } from "react";
import { FeedbackDocView } from "@/components/FeedbackDocView";

const STORAGE_KEY = "epp-initial-judges-feedback-open";

export function InitialJudgesFeedbackPanel({ applicationId }: { applicationId: string }) {
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
    <section className={`initial-judges-feedback${open ? " is-open" : ""}`} aria-label="Initial judges' feedback">
      <button
        type="button"
        className="initial-judges-feedback-toggle"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="initial-judges-feedback-label">Initial judges&apos; feedback</span>
        <span className="initial-judges-feedback-action">{open ? "Minimize" : "Expand"}</span>
      </button>
      {open ? (
        <div className="initial-judges-feedback-body">
          <FeedbackDocView applicationId={applicationId} compact />
        </div>
      ) : null}
    </section>
  );
}
