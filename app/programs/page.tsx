import type { Metadata } from "next";
import Link from "next/link";
import { programs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Programs",
  description: "Courses, Entrepreneurial Leadership, NSF I-Corps, EHour, the graduate certificate, and Perot Jain TechLabs.",
};

export default function ProgramsPage() {
  return (
    <article className="page">
      <header className="page-hero">
        <p className="kicker">Learn. Launch. Lead.</p>
        <h1>Every program is a different depth of commitment.</h1>
        <p className="lede dark">
          A Friday lecture and a year inside a startup are not the same ask. Start with the one that matches the time you actually have.
        </p>
      </header>
      <div className="program-index inset">
        {programs.map((program) => (
          <Link key={program.slug} href={program.href} className="program-row">
            <span className="idx">{program.index}</span>
            <span>
              <span className="row-kicker">{program.eyebrow}</span>
              <strong>{program.name}</strong>
              <span className="row-summary">{program.summary}</span>
            </span>
            <span className="row-go" aria-hidden>
              Enter
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}
