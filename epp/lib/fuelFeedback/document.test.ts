import assert from "node:assert/strict";
import { test } from "node:test";
import { RATING_TEXT } from "@/lib/fuelJudge/mapping";
import { buildFeedbackDocument, isConflict, parseScore, sampleFeedbackReviews } from "./document";
import { INITIAL_REVIEW_TYPE, PITCH_REVIEW_TYPE } from "./types";

test("parseScore reads CRM rating strings", () => {
  assert.equal(parseScore(RATING_TEXT[4]), 4);
  assert.equal(parseScore("5 = Exceptional"), 5);
  assert.equal(parseScore("3"), 3);
  assert.equal(parseScore(""), null);
});

test("conflict reviews are dropped and judges are anonymized in create order", () => {
  const doc = buildFeedbackDocument({
    applicationId: "sample-glass",
    projectName: "Glass Orchard",
    summary: "A film swap for growers.",
    mode: "mock",
    reviews: sampleFeedbackReviews("sample-glass"),
  });
  assert.equal(doc.reviewCount, 2);
  assert.equal(doc.omittedConflict, 1);
  assert.equal(doc.rounds.length, 1);
  assert.equal(doc.rounds[0].reviewType, INITIAL_REVIEW_TYPE);
  assert.deepEqual(
    doc.rounds[0].questions[0].chips.map((chip) => chip.judge),
    ["Judge A", "Judge B"],
  );
  assert.ok(doc.rounds[0].strengths.every((row) => !/Should be dropped/.test(row.text)));
});

test("pitch-round reviews become their own round when present", () => {
  const reviews = [
    ...sampleFeedbackReviews("deal-1").filter((row) => row.Conflict_of_Interest !== "Yes"),
    {
      id: "pitch-1",
      Application1: { id: "deal-1" },
      Review_Type: PITCH_REVIEW_TYPE,
      Conflict_of_Interest: "No",
      Created_Time: "2026-10-01T12:00:00-04:00",
      Final_Feedback_or_Outstanding_Questions_for_Team: "Clear pitch narrative.",
      Areas_for_Improvement: "Tighten the ask.",
    },
  ];
  const doc = buildFeedbackDocument({
    applicationId: "deal-1",
    projectName: "Demo",
    mode: "mock",
    reviews,
  });
  assert.equal(doc.rounds.length, 2);
  assert.equal(doc.rounds[0].id, "fuel-initial-judge-review");
  assert.equal(doc.rounds[1].reviewType, PITCH_REVIEW_TYPE);
  assert.equal(doc.rounds[1].questions.length, 0);
  assert.equal(doc.rounds[1].strengths[0].text, "Clear pitch narrative.");
});

test("empty pitch round does not break when only initial reviews exist", () => {
  const doc = buildFeedbackDocument({
    applicationId: "sample-glass",
    projectName: "Glass Orchard",
    mode: "mock",
    reviews: sampleFeedbackReviews("sample-glass"),
  });
  assert.equal(doc.rounds.some((round) => round.reviewType === PITCH_REVIEW_TYPE), false);
});

test("isConflict matches Yes only", () => {
  assert.equal(isConflict({ Conflict_of_Interest: "Yes" }), true);
  assert.equal(isConflict({ Conflict_of_Interest: "No" }), false);
  assert.equal(isConflict({ Conflict_of_Interest: "-None-" }), false);
});
