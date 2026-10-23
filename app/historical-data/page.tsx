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
          <p className="lede-sentence">Since the 2014 academic year, U-M undergraduate entrepreneurship and innovation opportunities have been globally top-ranked. The 2027 rankings will be our 13th year.</p>
        </div>
      </header>
      <HistoryDashboard />
    </article>
  );
}
