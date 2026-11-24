import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_APPLICATIONS } from "../fuelJudge/catalog";
import {
  awaitingFeedback,
  bottleneck,
  buildInsights,
  completeness,
  dedupeById,
  fundingSum,
  mergeStageOrder,
  missingRequired,
  stageColumnOrder,
  staleApplications,
} from "./metrics";
import { parseStoredReview } from "./reviews";

test("a saved column order is display-only and unknown stages append", () => {
  const saved = mergeStageOrder([], ["No Funding", "Ready For Initial Review"]);
  assert.ok(saved.indexOf("No Funding") < saved.indexOf("Ready For Initial Review"));
  assert.ok(saved.indexOf("Funding Awarded") > saved.indexOf("No Funding"));
  const visible = stageColumnOrder(
    ["Ready For Initial Review", "No Funding", "Custom Live Stage"],
    saved,
  );
  assert.deepEqual(visible, ["No Funding", "Ready For Initial Review", "Custom Live Stage"]);
  assert.deepEqual(
    stageColumnOrder(["Ready For Initial Review", "No Funding"], []),
    ["Ready For Initial Review", "No Funding"],
  );
});

test("reordering visible columns leaves a hidden stage where it was", () => {
  const saved = ["Ready For Initial Review", "Hidden Stage", "No Funding"];
  const next = mergeStageOrder(saved, ["No Funding", "Ready For Initial Review"]);
  assert.deepEqual(next.slice(0, 3), ["No Funding", "Hidden Stage", "Ready For Initial Review"]);
});

test("duplicate deal ids collapse and two deals that share a name both stay", () => {
  const first = SAMPLE_APPLICATIONS[0];
  const copy = { ...first };
  const twin = { ...first, id: "sample-harbor-2", projectName: first.projectName };
  const rows = dedupeById([first, copy, twin]);
  assert.deepEqual(rows.map((row) => row.id), [first.id, "sample-harbor-2"]);
});

test("completeness counts the five required documents", () => {
  assert.deepEqual(completeness(SAMPLE_APPLICATIONS[0]), { present: 5, required: 5 });
  assert.equal(missingRequired(SAMPLE_APPLICATIONS[0]), false);
  assert.equal(missingRequired(SAMPLE_APPLICATIONS[5]), true);
});

test("the bottleneck is the stage with the most applications", () => {
  const top = bottleneck(SAMPLE_APPLICATIONS);
  assert.equal(top?.stage, "Ready For Initial Review");
  assert.equal(top?.count, 2);
});

test("funding requested skips deals with no amount", () => {
  const rows = [
    SAMPLE_APPLICATIONS[0],
    { ...SAMPLE_APPLICATIONS[1], fundingRequested: null },
  ];
  assert.deepEqual(fundingSum(rows), { sum: 7500, known: 1, missing: 1 });
});

test("stale applications are the oldest last-edit times", () => {
  const rows = [
    { ...SAMPLE_APPLICATIONS[0], modifiedTime: "2026-11-02T15:00:00.000Z" },
    { ...SAMPLE_APPLICATIONS[1], modifiedTime: "2026-01-04T15:00:00.000Z" },
    { ...SAMPLE_APPLICATIONS[2], modifiedTime: null },
  ];
  const stale = staleApplications(rows, 1);
  assert.equal(stale[0]?.application.id, SAMPLE_APPLICATIONS[1].id);
});

test("no-feedback ignores teams that are still in a completeness check", () => {
  const waiting = awaitingFeedback(
    [{ ...SAMPLE_APPLICATIONS[1], stage: "Needs Completeness Check", totalReviews: 0, initialFeedback: [] }],
    new Map(),
  );
  assert.equal(waiting.length, 0);
  const sent = awaitingFeedback(
    [{ ...SAMPLE_APPLICATIONS[1], stage: "Out For Initial Review", totalReviews: 0, initialFeedback: [] }],
    new Map(),
  );
  assert.equal(sent.length, 1);
});

test("a stored dry-run review keeps the judge scores", () => {
  const parsed = parseStoredReview(
    {
      Application1: { id: "sample-harbor" },
      Reviewed_Project: "Harbor Lamp",
      Reviewer_First_Name: "Avery",
      Reviewer_Last_Name: "Chen",
      Review_Type: "Fuel initial judge review",
      Rating_for_Potential_for_Positive_Impact: "4 = Strong",
      Positive_Impact_Feedback: "The fog case is specific.",
      Rating_for_Value_Proposition: "3 = Adequate",
      Final_Feedback_or_Outstanding_Questions_for_Team: "Clear buyer.",
    },
    0,
  );
  assert.equal(parsed?.reviewer, "Avery Chen");
  assert.equal(parsed?.average, 3.5);
  assert.equal(parsed?.scores[0]?.comment, "The fog case is specific.");
  assert.equal(parsed?.dryRun, true);
  assert.equal(parsed?.source, "desk");
});

test("insights leave days in stage and awarded dollars empty", () => {
  const insights = buildInsights(SAMPLE_APPLICATIONS, [], Date.parse("2026-11-24T16:00:00.000Z"));
  assert.equal(insights.daysInStage, null);
  assert.equal(insights.funding.awarded, null);
  assert.equal(insights.funding.requested, SAMPLE_APPLICATIONS.reduce((sum, row) => sum + (row.fundingRequested ?? 0), 0));
  const harbor = insights.applications.find((row) => row.id === "sample-harbor");
  assert.deepEqual(harbor?.completeness, { present: 5, required: 5, missing: [] });
});
