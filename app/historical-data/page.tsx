import type { Metadata } from "next";
import { HistoryDashboard } from "@/components/HistoryDashboard";

export const metadata: Metadata = {
  title: "Historical Data",
  description: "Princeton Review reporting series for the University of Michigan Center for Entrepreneurship.",
};

export default function HistoricalDataPage() {
  return (
    <article>
      <header className="page-hero">
        <span className="tick" aria-hidden />
        <h1>Historical data</h1>
        <p>Nine reporting years. Enrollment, campus reach, venture testing, and student funding.</p>
      </header>
      <HistoryDashboard />
    </article>
  );
}
