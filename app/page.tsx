import Link from "next/link";
import { history, integer, latest, percent } from "@/lib/history";

const directories = [
  { name: "Events", note: "See what’s happening across units.", href: "https://entrepreneurship.umich.edu/events/" },
  { name: "Opportunities & Funding", note: "Resources to help guide your roadmap.", href: "https://entrepreneurship.umich.edu/programs/" },
  { name: "Student Orgs", note: "Find your co-curricular path.", href: "https://maizepages.umich.edu/organizations?query=entrepreneurship" },
];

export default function HomePage() {
  const maxPartners = Math.max(...history.map((row) => row.partners));

  return (
    <>
      <section className="brief">
        <p className="eyebrow">Princeton Review · Entrepreneur · 2026</p>
        <h1>Undergraduate overview</h1>
        <p className="brief-lede">
          Collaboration across campus partners and with the Office of Budget and Planning contributes to our rankings. Undergraduate survey responses are coordinated by the Center for Entrepreneurship. Graduate survey responses are coordinated by the Zell Lurie Institute. All reporting partners directly share in Michigan’s recognition for excellence in innovation and entrepreneurship.
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
          Annual global rankings are <a href="https://www.princetonreview.com/college-rankings/top-entrepreneur" target="_blank" rel="noreferrer">announced</a> by survey publishers mid-November. At present, nearly 30 campus-wide undergraduate entrepreneurship and innovation units participate in U-M’s reporting efforts, resulting in year-over-year Top 10 global rankings since 2016!
        </p>
        <div className="hero-actions">
          <Link className="btn-solid" href="/historical-data">Historical data</Link>
          <Link className="btn-line light" href="/partners">Partners</Link>
        </div>
      </section>

      <section className="home-block" data-reveal="item">
        <div className="block-head">
          <h2>Partners, year over year</h2>
          <p>U-M’s undergraduate schools, colleges, and units are listed on the Partners page.</p>
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
        <div className="block-head" data-reveal="item">
          <h2>What is happening at Michigan</h2>
        </div>
        <div className="activity-grid" data-reveal="group">
          {directories.map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noreferrer">
              <strong>{item.name}</strong>
              <span>{item.note}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
