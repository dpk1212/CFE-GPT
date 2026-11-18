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
  const partners = colleges
    .flatMap((college) => college.units.map((unit) => ({ ...unit, home: college.name })))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

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
        </div>
        <ul className="unit-grid" data-reveal="group">
          {partners.map((unit) => (
            <li key={unit.name}>
              <div>
                <strong>{unit.name}</strong>
                {unit.aka ? <span className="aka">{unit.aka}</span> : null}
              </div>
              {unit.home === unit.name ? null : <p className="unit-home">{unit.home}</p>}
              <UnitNote unit={unit} />
              {unit.href ? (
                <a className="unit-link" href={unit.href} target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
