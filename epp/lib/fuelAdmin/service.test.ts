import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_APPLICATIONS } from "../fuelJudge/catalog";
import { fuelWritesEnabled } from "../fuelJudge/service";
import { readEditable } from "./fields";
import { fuelAdminWritesEnabled, listFuelPipeline, updateFuelApplication, updateFuelStageOrder, updateFuelStages } from "./service";
import { resetFuelAdminState } from "./store";

test.beforeEach(() => {
  resetFuelAdminState();
  delete process.env.FUEL_CRM_MODE;
  delete process.env.FUEL_CRM_WRITES;
  delete process.env.FUEL_CRM_WRITES_DEAL_IDS;
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
  assert.equal(result.request?.method, "PUT");
  assert.equal(result.request?.path, "/crm/v8/Deals");
  assert.deepEqual(result.request?.body.trigger, ["workflow", "blueprint", "approval"]);
  assert.equal(result.request?.body.data[0].id, "sample-harbor");
  assert.equal(result.request?.body.data[0].Stage, "Out For Initial Review");
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
  assert.equal(result.request, undefined);
  assert.equal(fuelWritesEnabled(), false);
});

test("column order is stored without writing a deal", async () => {
  const saved = await updateFuelStageOrder(["No Funding", "Ready For Initial Review"], { durable: false });
  assert.ok(saved.stageOrder.indexOf("No Funding") < saved.stageOrder.indexOf("Ready For Initial Review"));
  const listed = await listFuelPipeline({
    durable: false,
    async source() {
      return SAMPLE_APPLICATIONS;
    },
  });
  assert.deepEqual(listed.stageOrder, saved.stageOrder);
  assert.equal(fuelAdminWritesEnabled(), false);
  const reset = await updateFuelStageOrder(null, { durable: false });
  assert.deepEqual(reset.stageOrder, []);
});

test("a mass stage move stays off unless admin writes are on", async () => {
  let writes = 0;
  await assert.rejects(
    () =>
      updateFuelStages(["sample-harbor"], "Out For Initial Review", { email: "admin@example.edu" }, {
        durable: false,
        async source() {
          return SAMPLE_APPLICATIONS;
        },
        writer: {
          async updateDeal() {
            writes += 1;
            return { id: "sample-harbor" };
          },
        },
      }),
    /Fuel admin writes are off/,
  );
  assert.equal(writes, 0);
});

test("a mass stage move writes only Stage, audits each change, and keeps going after a failure", async () => {
  process.env.FUEL_CRM_MODE = "live";
  process.env.FUEL_ADMIN_WRITES = "1";
  const writes: string[] = [];
  const result = await updateFuelStages(
    ["sample-northwind", "sample-harbor", "sample-harbor", "missing", "other"],
    "Invited For Presentation",
    { email: "Admin@Example.edu" },
    {
      durable: false,
      async source() {
        return [
          ...SAMPLE_APPLICATIONS,
          { ...SAMPLE_APPLICATIONS[0], id: "other", projectName: "Outside", pipeline: "Something Else" },
        ];
      },
      writer: {
        async updateDeal(id, fields) {
          writes.push(id);
          assert.deepEqual(fields, { Stage: "Invited For Presentation" });
          if (id === "sample-northwind") throw new Error("CRM rejected the stage.");
          return { id };
        },
      },
    },
  );
  assert.deepEqual(writes, ["sample-northwind", "sample-harbor"]);
  assert.deepEqual(result.updated.map((row) => row.id), ["sample-harbor"]);
  assert.equal(result.updated[0]?.from, "Ready For Initial Review");
  assert.equal(result.updated[0]?.to, "Invited For Presentation");
  assert.deepEqual(
    result.failed.map((row) => row.id),
    ["sample-northwind", "missing", "other"],
  );
  assert.equal(result.failed[0]?.error, "CRM rejected the stage.");
  assert.equal(result.unchanged.length, 0);
  const listed = await listFuelPipeline({
    durable: false,
    async source() {
      return SAMPLE_APPLICATIONS;
    },
  });
  assert.equal(listed.audit.length, 1);
  assert.equal(listed.audit[0]?.email, "admin@example.edu");
  assert.equal(listed.audit[0]?.applicationId, "sample-harbor");
  assert.equal(listed.audit[0]?.wrote, true);
  assert.deepEqual(listed.audit[0]?.changes, [
    { field: "Stage", label: "Stage", old: "Ready For Initial Review", new: "Invited For Presentation" },
  ]);
});

test("a mass stage move skips deals that are already at the target stage", async () => {
  process.env.FUEL_CRM_MODE = "live";
  process.env.FUEL_ADMIN_WRITES = "1";
  let writes = 0;
  const result = await updateFuelStages(
    ["sample-harbor"],
    "Ready For Initial Review",
    { email: "admin@example.edu" },
    {
      durable: false,
      async source() {
        return SAMPLE_APPLICATIONS;
      },
      writer: {
        async updateDeal() {
          writes += 1;
          return { id: "sample-harbor" };
        },
      },
    },
  );
  assert.equal(writes, 0);
  assert.equal(result.updated.length, 0);
  assert.equal(result.unchanged[0]?.id, "sample-harbor");
  assert.equal(result.failed.length, 0);
});

test("a mass stage move refuses a stage the Fuel desk does not use", async () => {
  process.env.FUEL_CRM_MODE = "live";
  process.env.FUEL_ADMIN_WRITES = "1";
  let writes = 0;
  await assert.rejects(
    () =>
      updateFuelStages(["sample-harbor"], "Closed Won", { email: "admin@example.edu" }, {
        durable: false,
        async source() {
          return SAMPLE_APPLICATIONS;
        },
        writer: {
          async updateDeal() {
            writes += 1;
            return { id: "sample-harbor" };
          },
        },
      }),
    /Fuel stage/,
  );
  assert.equal(writes, 0);
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
