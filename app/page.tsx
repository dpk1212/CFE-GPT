import Link from "next/link";
import { history, integer, latest, percent } from "@/lib/history";

const activities = [
  { name: "Entrepreneurship Minor and ENTR courses", note: "Open to students in every school and college. Advised by Ross.", href: "/partners#ross" },
  { name: "Zell Lurie Institute", note: "Ross grants, mentors, and accelerators. The Institute coordinates the graduate rankings.", href: "/partners#ross" },
  { name: "Business + Tech and Business + Impact", note: "Competitions, Impact Studio, the Erb Institute, and the Detroit Neighborhood Entrepreneurs Project.", href: "/partners#ross" },
  { name: "Center for Entrepreneurship", note: "ELP, EHour, I-Corps, and the TechLabs. Coordinates the undergraduate ranking.", href: "/partners#engineering" },
  { name: "optiMize", note: "LSA’s social innovation challenge and student community.", href: "/partners#lsa" },
  { name: "EXCEL Lab", note: "Venture and career support in Music, Theatre & Dance.", href: "/partners#smtd" },
  { name: "Center for Socially Engaged Engineering & Design", note: "Includes Innovation in Action.", href: "/partners#engineering" },
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
          Michigan’s undergraduate entrepreneurship ranking, prepared with the campus partners and coordinated by the Center for Entrepreneurship. Graduate rankings are coordinated by the Zell Lurie Institute.
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
            <span>Undergraduates reached, {latest.academic}</span>
          </article>
          <article>
            <strong>{percent(latest.ugShare)}</strong>
            <span>Share of the undergraduate student body</span>
          </article>
        </div>
        <p className="fine">
          In 2025, the undergraduate ranking was No. 6. The 2026 rankings were announced November 12, 2025. {integer(latest.partners)} partners contributed to the {latest.cycle} ranking.
        </p>
        <div className="hero-actions">
          <Link className="btn-solid" href="/historical-data">Historical data</Link>
          <Link className="btn-line light" href="/partners">Partners</Link>
        </div>
      </section>

      <section className="home-block">
        <div className="block-head">
          <h2>Partners, year over year</h2>
          <p>Campus partners contributing to the undergraduate ranking, by year. Colleges and units are listed on the Partners page.</p>
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
        <p className="fine">{history[0].partners} partners in {history[0].academic}. {latest.partners} in {latest.academic}. Maize marks the current year.</p>
      </section>

      <section className="home-block activities">
        <div className="block-head">
          <h2>What is happening at Michigan</h2>
          <p>Entrepreneurship and innovation across the colleges and schools. Each partner is described in the directory.</p>
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
