"use client";

import { useEffect, useState } from "react";
import {
  INITIAL_REVIEW_TYPE,
  PITCH_REVIEW_TYPE,
  type FeedbackDocument,
  type FeedbackRound,
} from "@/lib/fuelFeedback/types";
import type { FuelFormId } from "@/lib/fuelJudge/types";

export function reviewTypeForForm(form: FuelFormId) {
  return form === "pitch" ? PITCH_REVIEW_TYPE : INITIAL_REVIEW_TYPE;
}

export function roundForForm(doc: FeedbackDocument | null | undefined, form: FuelFormId): FeedbackRound | null {
  if (!doc) return null;
  const type = reviewTypeForForm(form);
  return doc.rounds.find((round) => round.reviewType === type) || null;
}

/** Prefer initial-round feedback for the left-rail cross-reference panel. */
export function initialFeedbackRound(doc: FeedbackDocument | null | undefined): FeedbackRound | null {
  if (!doc) return null;
  return (
    doc.rounds.find((round) => round.reviewType === INITIAL_REVIEW_TYPE) ||
    doc.rounds[0] ||
    null
  );
}

export function useFeedbackDocument(applicationId: string | null) {
  const [doc, setDoc] = useState<FeedbackDocument | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(applicationId));

  useEffect(() => {
    if (!applicationId) {
      setDoc(null);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setDoc(null);
    fetch(`/api/feedback/${encodeURIComponent(applicationId)}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (FeedbackDocument & { error?: string }) | null;
        if (cancelled) return;
        if (!response.ok || !body || body.error) {
          setError(body?.error || "Judge feedback could not be loaded.");
          return;
        }
        setDoc(body);
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

  return { doc, error, loading };
}
