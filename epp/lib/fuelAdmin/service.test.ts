import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_APPLICATIONS } from "../fuelJudge/catalog";
import { fuelWritesEnabled } from "../fuelJudge/service";
import { readEditable } from "./fields";
import { fuelAdminWritesEnabled, listFuelPipeline, updateFuelApplication } from "./service";
import { resetFuelAdminState } from "./store";

test.beforeEach(() => {
  resetFuelAdminState();
  delete process.env.FUEL_CRM_MODE;
  delete process.env.FUEL_CRM_WRITES;
  delete process.env.FUEL_ADMIN_WRITES;
});

test("a dry run records the old and new values and does not call Zoho", async () => {
  let writes = 0;
  const result = await updateFuelApplication(
    "sample-harbor",
    { ...readEditable(SAMPLE_APPLICATIONS[0]), stage: "Out For Initial Review", fundingRequested: 8000 },
    { email: "Admin@Example.edu" },
    {
      durable: false,
      async source() {
        return SAMPLE_APPLICATIONS;
      },
      writer: {
        async updateDeal() {
          writes += 1;
          return { id: "nope" };
        },
      },
    },
  );
  assert.equal(writes, 0);
  assert.equal(result.wrote, false);
  assert.equal(result.record.Stage, "Out For Initial Review");
  assert.equal(result.record.What_Funding_Are_You_Requesting, 8000);
  assert.deepEqual(
    result.changes.map((change) => change.field),
    ["Stage", "What_Funding_Are_You_Requesting"],
  );
  assert.equal(result.changes[0].old, "Ready For Initial Review");
  assert.equal(result.changes[0].new, "Out For Initial Review");
  const listed = await listFuelPipeline({
    durable: false,
    async source() {
      return SAMPLE_APPLICATIONS;
    },
  });
  assert.equal(listed.applications.find((row) => row.id === "sample-harbor")?.stage, "Out For Initial Review");
  assert.equal(listed.audit[0]?.email, "admin@example.edu");
  assert.equal(listed.audit[0]?.wrote, false);
  assert.equal(fuelAdminWritesEnabled(), false);
  assert.equal(fuelWritesEnabled(), false);
});

test("admin writes stay off unless live mode and FUEL_ADMIN_WRITES are both set", async () => {
  process.env.FUEL_ADMIN_WRITES = "1";
  assert.equal(fuelAdminWritesEnabled(), false);
  process.env.FUEL_CRM_MODE = "live";
  assert.equal(fuelAdminWritesEnabled(), true);
  assert.equal(fuelWritesEnabled(), false);
});

test("a deal outside the Fuel pipelines is refused", async () => {
  await assert.rejects(
    () =>
      updateFuelApplication(
        "other",
        { ...readEditable(SAMPLE_APPLICATIONS[0]), projectName: "Other" },
        { email: "admin@example.edu" },
        {
          durable: false,
          async source() {
            return [{ ...SAMPLE_APPLICATIONS[0], id: "other", pipeline: "Something Else" }];
          },
        },
      ),
    /Fuel pipeline/,
  );
});

test("live admin writes update the deal and leave review creates off", async () => {
  process.env.FUEL_CRM_MODE = "live";
  process.env.FUEL_ADMIN_WRITES = "1";
  let writes = 0;
  const result = await updateFuelApplication(
    "sample-harbor",
    { ...readEditable(SAMPLE_APPLICATIONS[0]), stage: "Initial Feedback Returned" },
    { email: "admin@example.edu" },
    {
      durable: false,
      async source() {
        return SAMPLE_APPLICATIONS;
      },
      writer: {
        async updateDeal(id, fields) {
          writes += 1;
          assert.equal(id, "sample-harbor");
          assert.equal(fields.Stage, "Initial Feedback Returned");
          assert.equal("Number_of_Application_Reviews" in fields, false);
          return { id };
        },
      },
    },
  );
  assert.equal(writes, 1);
  assert.equal(result.wrote, true);
  assert.equal(fuelWritesEnabled(), false);
});

test("an unknown stage is refused", async () => {
  await assert.rejects(
    () =>
      updateFuelApplication(
        "sample-harbor",
        { ...readEditable(SAMPLE_APPLICATIONS[0]), stage: "Closed Won" },
        { email: "admin@example.edu" },
        {
          durable: false,
          async source() {
            return SAMPLE_APPLICATIONS;
          },
        },
      ),
    /Fuel stage/,
  );
});
