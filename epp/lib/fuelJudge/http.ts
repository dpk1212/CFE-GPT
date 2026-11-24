import { FuelJudgeError, fuelDashboard, submitFuelReview, updateFuelConfig } from "./service";
import type { FuelJudgeConfig, ReviewInput, ReviewerIdentity } from "./types";

export async function handleFuelJudge(input: {
  method: string;
  action: string;
  body: unknown;
  reviewer: ReviewerIdentity | null;
  role: string | null;
  authOpen: boolean;
}) {
  try {
    if (input.method === "GET" && input.action === "dashboard") {
      return { status: 200, body: await fuelDashboard() };
    }
    if (input.method === "PUT" && input.action === "config") {
      if (!input.authOpen && input.role !== "admin") {
        return { status: 403, body: { error: "Admin only" } };
      }
      const next = input.body as FuelJudgeConfig;
      return { status: 200, body: { config: await updateFuelConfig(next) } };
    }
    if (input.method === "POST" && input.action === "reviews") {
      if (!input.reviewer?.email) {
        return { status: 401, body: { error: "Sign in to submit a review." } };
      }
      const created = await submitFuelReview(input.body as ReviewInput, input.reviewer);
      return {
        status: 200,
        body: {
          id: created.id,
          wrote: created.wrote,
          project: created.record.Reviewed_Project,
          reviewType: created.record.Review_Type,
          // When CRM writes are off, return the Application_Review payload for staff review.
          record: created.wrote ? undefined : created.record,
        },
      };
    }
    return { status: 404, body: { error: "Not found" } };
  } catch (err) {
    if (err instanceof FuelJudgeError) {
      return { status: err.status, body: { error: err.message } };
    }
    const message = err instanceof Error ? err.message : "Fuel judge request failed";
    return { status: 500, body: { error: message } };
  }
}
