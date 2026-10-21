import type { Metadata } from "next";
import Link from "next/link";
import { campusNetwork, history, integer, latest } from "@/lib/history";

export const metadata: Metadata = {
  title: "Partners",
  description: "Reporting partners of the University of Michigan Center for Entrepreneurship.",
};

export default function PartnersPage() {
  const max = Math.max(...history.map((row) => row.partners));

  return (
    <article>
      <header className="page-hero">
        <span className="tick" aria-hidden />
        <h1>Partners</h1>
        <p>Schools, colleges, and programs that report with the Center.</p>
      </header>
      <section className="sheet">
        <div className="partner-lead">
          <div>
            <p className="kpi-value">{integer(latest.partners)}</p>
            <p className="kpi-label">Reporting partners, {latest.academic}</p>
            <p className="quiet">Prepared for the {latest.cycle} rankings cycle. The series opens at {history[0].partners} partners in {history[0].academic}.</p>
            <Link className="text-link" href="/historical-data">Open the historical series</Link>
          </div>
          <svg className="partner-bars" viewBox="0 0 360 160" role="img" aria-label="Reporting partners by year">
            {history.map((row, index) => {
              const gap = 8;
              const width = (360 - gap * (history.length - 1)) / history.length;
              const height = (row.partners / max) * 120;
              const x = index * (width + gap);
              const y = 130 - height;
              return (
                <g key={row.academic}>
                  <rect x={x} y={y} width={width} height={height} fill={index === history.length - 1 ? "#FFCB05" : "#00274C"} />
                  <text x={x + width / 2} y={150} textAnchor="middle" fontSize="9" fill="#5c6b7c">{row.cycle.slice(2)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <h2>Campus network</h2>
        <p className="quiet">Names published by the Center as part of the entrepreneurship network. The reporting-partner count above is the figure used in the rankings file.</p>
        <ul className="partner-list">
          {campusNetwork.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
