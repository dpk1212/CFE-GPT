import Link from "next/link";
import { integer, latest, percent } from "@/lib/history";
import { colleges, unitCount } from "@/lib/partners";

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="hero-kicker">Undergraduate ecosystem</p>
          <h1>
            Entrepreneurship
            <span> + Innovation</span>
          </h1>
          <p className="home-lede">
            Michigan’s campus-wide entrepreneurship network. This site is the undergraduate reporting record: who participates, and the file the Center for Entrepreneurship submits to the Princeton Review.
          </p>
          <div className="hero-actions">
            <Link className="btn-solid" href="/historical-data">Undergraduate data</Link>
            <Link className="btn-line" href="/partners">Reporting partners</Link>
          </div>
        </div>
        <aside className="role-card">
          <p>Scope of this record</p>
          <dl>
            <div>
              <dt>Whose ecosystem</dt>
              <dd>University of Michigan</dd>
            </div>
            <div>
              <dt>Who reports it</dt>
              <dd>Center for Entrepreneurship</dd>
            </div>
            <div>
              <dt>What is in the file</dt>
              <dd>Undergraduates only</dd>
            </div>
            <div>
              <dt>Latest year</dt>
              <dd>{latest.academic} for the {latest.cycle} cycle</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="stat-band" aria-label="Latest undergraduate figures">
        <article>
          <strong>No. 4</strong>
          <span>Undergraduate, national, 2026</span>
        </article>
        <article>
          <strong>No. 1</strong>
          <span>Undergraduate, Midwest, 2026</span>
        </article>
        <article>
          <strong>{integer(latest.enrollment)}</strong>
          <span>Undergraduates in the {latest.academic} file</span>
        </article>
        <article>
          <strong>{percent(latest.ugShare)}</strong>
          <span>Of the undergraduate body, deduped</span>
        </article>
      </section>

      <section className="home-directory">
        <div className="directory-head">
          <div>
            <p className="hero-kicker dark">Partners</p>
            <h2>{unitCount} units, grouped by college.</h2>
          </div>
          <p>
            The {latest.academic} file counted {integer(latest.partners)} reporting partners. The directory below is the named set so far. More units can be added without changing the historical counts.
          </p>
        </div>
        <div className="college-index">
          {colleges.map((college) => (
            <Link key={college.id} href={`/partners#${college.id}`}>
              <span>{college.name}</span>
              <em>{college.units.length}</em>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
