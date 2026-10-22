import Link from "next/link";
import { history, integer, latest, percent } from "@/lib/history";

const activities = [
  { name: "Entrepreneurship Minor and ENTR courses", note: "Open to every school. This is the coursework inside the undergraduate file.", href: "/partners#university" },
  { name: "Zell Lurie Institute", note: "Ross grants, mentors, and accelerators for student ventures.", href: "/partners#ross" },
  { name: "Business + Tech and Business + Impact", note: "Competitions, Impact Studio, and DNEP.", href: "/partners#ross" },
  { name: "Center for Entrepreneurship", note: "ELP, EHour, I-Corps, and the TechLabs. CFE also compiles this file.", href: "/partners#engineering" },
  { name: "optiMize", note: "LSA’s social innovation challenge and student community.", href: "/partners#lsa" },
  { name: "EXCEL Lab", note: "Venture and career support in Music, Theatre & Dance.", href: "/partners#smtd" },
  { name: "Center for Socially Engaged Design", note: "Includes Innovation in Action.", href: "/partners#engineering" },
  { name: "Wilson Center and MDP", note: "Engineering team projects and multidisciplinary design.", href: "/partners#engineering" },
];

export default function HomePage() {
  const maxPartners = Math.max(...history.map((row) => row.partners));

  return (
    <>
      <section className="brief">
        <p className="eyebrow">Princeton Review · Entrepreneur · 2026</p>
        <h1>Undergraduate overview</h1>
        <p className="brief-lede">
          The University of Michigan’s undergraduate entrepreneurship submission. The Center for Entrepreneurship collects it from the reporting partners. Graduate rankings are a separate list and are not in this file.
        </p>
        <div className="stat-band" aria-label="2026 undergraduate placement">
          <article>
            <strong>No. 4</strong>
            <span>Undergraduate, national</span>
          </article>
          <article>
            <strong>No. 1</strong>
            <span>Undergraduate, Midwest</span>
          </article>
          <article>
            <strong>{integer(latest.enrollment)}</strong>
            <span>Students in the {latest.academic} file</span>
          </article>
          <article>
            <strong>{percent(latest.ugShare)}</strong>
            <span>Of undergraduates, counted once</span>
          </article>
        </div>
        <p className="fine">
          The 2025 undergraduate list was No. 6. The 2026 lists were announced November 12, 2025. {integer(latest.partners)} partners reported for the {latest.cycle} cycle.
        </p>
        <div className="hero-actions">
          <Link className="btn-solid" href="/historical-data">Historical data</Link>
          <Link className="btn-line light" href="/partners">Partners</Link>
        </div>
      </section>

      <section className="home-block">
        <div className="block-head">
          <h2>Partners, year over year</h2>
          <p>How many units submitted undergraduate data for each rankings cycle. Names and colleges are on the partners page.</p>
        </div>
        <svg className="yoy" viewBox="0 0 720 220" role="img" aria-label="Reporting partners by rankings year">
          {history.map((row, index) => {
            const slot = 720 / history.length;
            const barW = slot * 0.55;
            const h = (row.partners / maxPartners) * 150;
            const x = slot * index + (slot - barW) / 2;
            const y = 170 - h;
            const current = row === latest;
            return (
              <g key={row.cycle}>
                <rect x={x} y={y} width={barW} height={h} fill={current ? "#FFCB05" : "#00274C"} />
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" className="yoy-value">{row.partners}</text>
                <text x={x + barW / 2} y={196} textAnchor="middle" className="yoy-label">’{row.cycle.slice(2)}</text>
              </g>
            );
          })}
        </svg>
        <p className="fine">From {history[0].partners} partners in {history[0].academic} to {latest.partners} in {latest.academic}. The maize bar is the current file.</p>
      </section>

      <section className="home-block activities">
        <div className="block-head">
          <h2>What is happening at Michigan</h2>
          <p>A short map of the ecosystem behind the file. Detail on each unit lives with the partners.</p>
        </div>
        <div className="activity-grid">
          {activities.map((item) => (
            <Link key={item.name} href={item.href}>
              <strong>{item.name}</strong>
              <span>{item.note}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
