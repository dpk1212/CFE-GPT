import type { Metadata } from "next";
import { HistoryDashboard } from "@/components/HistoryDashboard";

export const metadata: Metadata = {
  title: "Historical Data",
  description: "Nine years of Michigan’s undergraduate entrepreneurship ranking.",
};

export default function HistoricalDataPage() {
  return (
    <article>
      <header className="page-hero">
        <span className="tick" aria-hidden />
        <h1>Historical data</h1>
        <p>Nine years of the undergraduate ranking, prepared by the Center for Entrepreneurship with the campus partners.</p>
      </header>
      <HistoryDashboard />
    </article>
  );
}
