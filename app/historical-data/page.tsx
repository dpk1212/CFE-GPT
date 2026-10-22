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
        <div className="hero-rule">
          <h1>Historical data</h1>
          <p>Nine years of the undergraduate ranking, coordinated by the Center for Entrepreneurship with the campus partners.</p>
        </div>
      </header>
      <HistoryDashboard />
    </article>
  );
}
