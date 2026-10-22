import type { Metadata } from "next";
import { integer, latest } from "@/lib/history";
import { colleges, unitCount } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Partners",
  description: "Colleges, schools, and units in University of Michigan Entrepreneurship & Innovation.",
};

export default function PartnersPage() {
  return (
    <article>
      <header className="page-hero">
        <div className="hero-rule">
          <h1>Partners</h1>
          <p>The colleges, schools, and units of Entrepreneurship &amp; Innovation at Michigan.</p>
        </div>
      </header>
      <section className="sheet directory">
        <div className="directory-lead">
          <p>
            {unitCount} units are named here, across {colleges.length} groups. {integer(latest.partners)} partners contributed to the {latest.academic} undergraduate ranking. The directory will grow as additional partners are confirmed.
          </p>
          <nav className="partner-index" aria-label="Schools and groups">
            {colleges.map((college) => (
              <a key={college.id} href={`#${college.id}`}>
                {college.short}
                <em>{college.units.length}</em>
              </a>
            ))}
          </nav>
        </div>
        {colleges.map((college) => (
          <section key={college.id} id={college.id} className="college">
            <div className="college-head">
              <h2>{college.name}</h2>
              <span>{college.units.length === 1 ? "1 unit" : `${college.units.length} units`}</span>
            </div>
            {college.units.length === 1 && college.units[0].name === college.name ? (
              <div className="solo-unit">
                <p>{college.units[0].note}</p>
                {college.units[0].href ? (
                  <a className="unit-link" href={college.units[0].href} target="_blank" rel="noreferrer">
                    Official site
                  </a>
                ) : null}
              </div>
            ) : (
            <ul className="unit-grid">
              {college.units.map((unit) => (
                <li key={unit.name}>
                  <div>
                    <strong>{unit.name}</strong>
                    {unit.aka ? <span className="aka">{unit.aka}</span> : null}
                  </div>
                  <p>{unit.note}</p>
                  {unit.href ? (
                    <a className="unit-link" href={unit.href} target="_blank" rel="noreferrer">
                      Official site
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            )}
          </section>
        ))}
      </section>
    </article>
  );
}
