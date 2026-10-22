import type { Metadata } from "next";
import { HistoryDashboard } from "@/components/HistoryDashboard";

export const metadata: Metadata = {
  title: "Historical Data",
  description: "Undergraduate Princeton Review reporting series for University of Michigan Entrepreneurship + Innovation.",
};

export default function HistoricalDataPage() {
  return (
    <article>
      <header className="page-hero">
        <span className="tick" aria-hidden />
        <h1>Historical data</h1>
        <p>Undergraduate file only. Nine years, compiled by the Center for Entrepreneurship.</p>
      </header>
      <HistoryDashboard />
    </article>
  );
}
