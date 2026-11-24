import assert from "node:assert/strict";
import test from "node:test";
import { applicationsForStage, SAMPLE_APPLICATIONS } from "./catalog";
import { DEFAULT_FUEL_CONFIG } from "./defaults";
import { buildCrmRecord, RATING_TEXT } from "./mapping";
import { fuelDashboard, fuelWritesEnabled, submitFuelReview } from "./service";
import { resetFuelJudgeState, saveFuelConfig } from "./store";
import type { WrittenReviewInput } from "./types";

test.beforeEach(() => {
  resetFuelJudgeState();
  delete process.env.FUEL_CRM_MODE;
  delete process.env.FUEL_CRM_WRITES;
  delete process.env.FUEL_CRM_WRITES_DEAL_IDS;
});

test("stage 1 shows the written-review queue and stage 2 shows invited teams", () => {
  const written = DEFAULT_FUEL_CONFIG.stages[0];
  const pitch = DEFAULT_FUEL_CONFIG.stages[1];
  assert.deepEqual(
    applicationsForStage(SAMPLE_APPLICATIONS, written).map((row) => row.projectName),
    ["Harbor Lamp", "Northwind Sensor", "Paper Kite"],
  );
  assert.deepEqual(
    applicationsForStage(SAMPLE_APPLICATIONS, pitch).map((row) => row.projectName),
    ["Glass Orchard", "Cedar Route"],
  );
  assert.equal(written.columns.includes("totalReviews"), true);
  assert.equal(pitch.columns.includes("totalReviews"), false);
  assert.equal(pitch.columns.includes("initialFeedback"), true);
});

test("a written review maps onto the same Application Review fields the form uses", async () => {
  const created = await submitFuelReview(
    writtenInput(),
    {
      email: "Judge@Example.edu",
      name: "Ada Judge",
    },
    undefined,
    { durable: false },
  );
  assert.equal(created.wrote, false);
  assert.equal(created.record.Review_Type, "Fuel initial judge review");
  assert.equal(created.record.Status, "Submitted");
  assert.equal(created.record.Reviewed_Project, "Harbor Lamp");
  assert.deepEqual(created.record.Application1, { id: "sample-harbor" });
  assert.equal(created.record.Reviewer_Email, "judge@example.edu");
  assert.equal(created.record.Reviewer_First_Name, "Ada");
  assert.equal(created.record.Reviewer_Last_Name, "Judge");
  assert.equal(created.record.Conflict_of_Interest, "No");
  assert.equal(created.record.Rating_for_Potential_for_Positive_Impact, RATING_TEXT[4]);
  assert.equal(created.record.Rating_for_Value_Proposition, RATING_TEXT[3]);
  assert.equal(created.record.Sustainability_and_Viability_of_the_Venture, RATING_TEXT[2]);
  assert.equal(created.record.Rating_for_Freedom_to_Operate, RATING_TEXT[5]);
  assert.equal(created.record.Rating_for_Go_to_Market, RATING_TEXT[1]);
  assert.equal(
    created.record.Should_This_Team_Advance_to_Presenting,
    "Yes, this team/project should advance",
  );
  assert.equal(created.record.Final_Feedback_or_Outstanding_Questions_for_Team, "Clear buyer.");
  assert.equal(created.record.Internal_Notes, "Staff only.");
  assert.equal("Reviewer" in created.record, false);
  assert.equal("Owner" in created.record, false);
  assert.equal(created.request.method, "POST");
  assert.equal(created.request.path, "/crm/v8/Application_Review");
  assert.deepEqual(created.request.body.trigger, ["workflow", "blueprint", "approval"]);
  assert.equal(created.request.body.data[0], created.record);
  assert.equal(fuelWritesEnabled(), false);
});

test("a pitch review maps the three notes and the funding recommendation", async () => {
  saveFuelConfig({ ...DEFAULT_FUEL_CONFIG, activeStageId: "pitch" });
  const created = await submitFuelReview(
    {
      form: "pitch",
      applicationId: "sample-glass",
      confidentiality: true,
      conflict: "No",
      didWell: "The grower quote was specific.",
      prioritize: "Name the buyer.",
      coach: "A greenhouse operator in Ann Arbor.",
      funding: "yes",
      internalNotes: "Fund the pilot film only.",
    },
    { email: "ada@example.edu", name: "Ada Judge" },
    undefined,
    { durable: false },
  );
  assert.equal(created.wrote, false);
  assert.equal(created.record.Name, "Fuel Presentation Review_Glass Orchard");
  assert.equal(created.record.Review_Type, "Funding Recommendation");
  assert.equal(created.record.Funding_Recommendation, "Yes");
  assert.equal(
    created.record.Final_Feedback_or_Outstanding_Questions_for_Team,
    "The grower quote was specific.",
  );
  assert.equal(created.record.Areas_for_Improvement, "Name the buyer.");
  assert.equal(
    created.record.Do_you_Know_a_Good_Coach_for_This_Team,
    "A greenhouse operator in Ann Arbor.",
  );
  assert.equal(created.record.Internal_Notes, "Fund the pilot film only.");
  assert.equal("How_much_funding" in created.record, false);
});

test("hiding a column and a status changes the dashboard the judge sees", async () => {
  const next = structuredClone(DEFAULT_FUEL_CONFIG);
  next.stages[0].columns = next.stages[0].columns.filter((column) => column !== "video");
  next.stages[0].statuses = ["Ready For Initial Review"];
  saveFuelConfig(next);
  const dashboard = await fuelDashboard(
    {
      async listApplications() {
        return SAMPLE_APPLICATIONS;
      },
      async createReview() {
        throw new Error("createReview must not run while listing");
      },
    },
    { durable: false },
  );
  assert.deepEqual(
    dashboard.applications.map((row) => row.projectName),
    ["Harbor Lamp", "Paper Kite"],
  );
  assert.equal(dashboard.stage.columns.includes("video"), false);
});

test("an allowlist writes only the named deal", async () => {
  process.env.FUEL_CRM_MODE = "live";
  process.env.FUEL_CRM_WRITES_DEAL_IDS = "sample-harbor";
  let writes = 0;
  const created = await submitFuelReview(
    writtenInput(),
    reviewer(),
    {
      async listApplications() {
        return SAMPLE_APPLICATIONS;
      },
      async createReview() {
        writes += 1;
        return { id: "review-1" };
      },
    },
    { durable: false },
  );
  assert.equal(writes, 1);
  assert.equal(created.wrote, true);
  assert.equal(fuelWritesEnabled("sample-glass"), false);
  assert.equal(fuelWritesEnabled(), false);
});

test("a live writer is not called when CRM writes are off", async () => {
  let writes = 0;
  const created = await submitFuelReview(
    writtenInput(),
    reviewer(),
    {
      async listApplications() {
        return SAMPLE_APPLICATIONS;
      },
      async createReview() {
        writes += 1;
        return { id: "should-not-happen" };
      },
    },
    { durable: false },
  );
  assert.equal(writes, 0);
  assert.equal(created.wrote, false);
  assert.match(created.id, /^local-/);
});

test("deal rows use the Fuel application fields from CRM", async () => {
  const { dealToApplication } = await import("./mapping");
  const application = dealToApplication({
    id: "138",
    Project_Name: "Harbor Lamp",
    Stage: "Invited For Presentation",
    Pipeline: "Fuel",
    Number_of_Application_Reviews: 4,
    One_Sentence_Project_Summary: "A dock light.",
    Project_Industries: "Marine",
    PDF_URL: "https://example.com/app",
    What_Funding_Are_You_Requesting: 7500,
    Supporting_URL: "https://example.com/deck",
  });
  assert.equal(application?.stage, "Invited For Presentation");
  assert.equal(application?.fuelApplicationUrl, "https://example.com/app");
  assert.equal(application?.pitchDeckUrl, "https://example.com/deck");
  assert.equal(application?.fundingRequested, 7500);
});

function reviewer() {
  return { email: "ada@example.edu", name: "Ada Judge" };
}

function writtenInput(): WrittenReviewInput {
  return {
    form: "written",
    applicationId: "sample-harbor",
    conflict: "No",
    confidentiality: true,
    ratings: { problem: 4, solution: 3, market: 2, freedom: 5, execution: 1 },
    feedback: { problem: "Talked to sailors." },
    strengths: "Clear buyer.",
    improvements: "Budget is a lump sum.",
    advance: "yes",
    coach: "",
    internalNotes: "Staff only.",
  };
}
