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
        <span className="tick" aria-hidden />
        <h1>Partners</h1>
        <p>The colleges, schools, and units of Entrepreneurship &amp; Innovation at Michigan.</p>
      </header>
      <section className="sheet">
        <p className="directory-note">
          {unitCount} units are named here, across {colleges.length} groups. {integer(latest.partners)} partners contributed to the {latest.academic} undergraduate ranking. The directory will grow as additional partners are confirmed.
        </p>
        {colleges.map((college) => (
          <section key={college.id} id={college.id} className="college">
            <h2>{college.name}</h2>
            <ul>
              {college.units.map((unit) => (
                <li key={unit.name}>
                  <div>
                    <strong>{unit.name}</strong>
                    {unit.aka ? <span className="aka">{unit.aka}</span> : null}
                  </div>
                  {unit.note ? <p>{unit.note}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </article>
  );
}
