export function stageTone(stage: string): "idle" | "warn" | "active" | "good" | "bad" | "neutral" {
  if (stage === "Needs Completeness Check" || stage === "Student Revision Needed") return "warn";
  if (
    stage === "Ready For Initial Review" ||
    stage === "Out For Initial Review" ||
    stage === "Initial Feedback Returned" ||
    stage === "Invited For Presentation" ||
    stage === "Student Invited to Meet with Fuel staff" ||
    stage === "Out For Funding Decision"
  ) {
    return "active";
  }
  if (stage === "Award Tentatively Approved" || stage === "Funding Awarded") return "good";
  if (stage === "Not Invited To Present" || stage === "No Funding") return "bad";
  return "neutral";
}
