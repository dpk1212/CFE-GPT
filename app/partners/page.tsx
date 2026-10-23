import type { Metadata } from "next";
import { colleges } from "@/lib/partners";

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
          <p className="lede-sentence">Discover the colleges, schools, and units supporting Entrepreneurship &amp; Innovation across Michigan.</p>
        </div>
      </header>
      <section className="sheet directory">
        <div className="directory-lead">
          <p>
            The directory will grow as additional partners join the ecosystem.
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
                    Website
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
                      Website
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
