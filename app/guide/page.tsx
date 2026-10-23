import type { Metadata } from "next";
import { GuideDesk } from "@/components/GuideDesk";

export const metadata: Metadata = {
  title: "CFE Guide",
  description: "A briefing desk for published Center for Entrepreneurship programs, courses, and the 2026 Princeton Review placement.",
};

export default function GuidePage() {
  return (
    <article className="page guide-page">
      <header className="page-hero">
        <p className="kicker">CFE Guide</p>
        <h1>Questions, answered from the record.</h1>
        <p className="lede dark">
          Built for the same job as a good program page: specific, sourced, and unwilling to invent a date. It is a guide to published materials, not a registrar.
        </p>
      </header>
      <GuideDesk />
    </article>
  );
}
