import type { Metadata } from "next";
import type { Unit } from "@/lib/partners";
import { colleges } from "@/lib/partners";

function UnitNote({ unit }: { unit: Unit }) {
  const links = unit.noteLinks ?? [];
  if (links.length === 0) return <p>{unit.note}</p>;
  const pattern = new RegExp(`(${links.map((link) => link.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = unit.note.split(pattern);
  return (
    <p>
      {parts.map((part, index) => {
        const link = links.find((item) => item.label === part);
        if (!link) return part;
        return (
          <a key={`${link.href}-${index}`} className="note-link" href={link.href} target="_blank" rel="noreferrer">
            {part}
          </a>
        );
      })}
    </p>
  );
}

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
        <div className="directory-lead" data-reveal="item">
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
            <div className="college-head" data-reveal="item">
              <h2>{college.name}</h2>
              <span>{college.units.length === 1 ? "1 unit" : `${college.units.length} units`}</span>
            </div>
            {college.units.length === 1 && college.units[0].name === college.name ? (
              <div className="solo-unit" data-reveal="item">
                <UnitNote unit={college.units[0]} />
                {college.units[0].href ? (
                  <a className="unit-link" href={college.units[0].href} target="_blank" rel="noreferrer">
                    Website
                  </a>
                ) : null}
              </div>
            ) : (
            <ul className="unit-grid" data-reveal="group">
              {college.units.map((unit) => (
                <li key={unit.name}>
                  <div>
                    <strong>{unit.name}</strong>
                    {unit.aka ? <span className="aka">{unit.aka}</span> : null}
                  </div>
                  <UnitNote unit={unit} />
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
