import type { FuelColumnId, FuelJudgeConfig } from "./types";

const WRITTEN_COLUMNS: FuelColumnId[] = [
  "totalReviews",
  "projectName",
  "summary",
  "industries",
  "fuelApplication",
  "fundingRequested",
  "budgetUrl",
  "quadChart",
  "technicalEvidence",
  "traction",
  "images",
  "pitchDeck",
  "video",
  "additional",
];

const PITCH_COLUMNS: FuelColumnId[] = [
  "projectName",
  "summary",
  "industries",
  "fuelApplication",
  "fundingRequested",
  "budgetUrl",
  "quadChart",
  "technicalEvidence",
  "traction",
  "images",
  "pitchDeck",
  "video",
  "additional",
  "initialFeedback",
];

export const DEFAULT_FUEL_CONFIG: FuelJudgeConfig = {
  activeStageId: "written",
  stages: [
    {
      id: "written",
      name: "Fuel Written Application Review",
      form: "written",
      statuses: ["Ready For Initial Review", "Out For Initial Review"],
      pipelines: ["Fuel"],
      columns: WRITTEN_COLUMNS,
    },
    {
      id: "pitch",
      name: "Fuel Pitch and Funding Feedback",
      form: "pitch",
      statuses: ["Invited For Presentation"],
      pipelines: ["Fuel"],
      columns: PITCH_COLUMNS,
    },
  ],
};

export function cloneConfig(config: FuelJudgeConfig = DEFAULT_FUEL_CONFIG): FuelJudgeConfig {
  return JSON.parse(JSON.stringify(config)) as FuelJudgeConfig;
}
