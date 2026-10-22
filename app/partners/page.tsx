import type { Metadata } from "next";
import { integer, latest } from "@/lib/history";
import { colleges, unitCount } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Partners",
  description: "University of Michigan colleges and units in the undergraduate entrepreneurship reporting file.",
};

export default function PartnersPage() {
  return (
    <article>
      <header className="page-hero">
        <span className="tick" aria-hidden />
        <h1>Partners</h1>
        <p>Departments and units inside the colleges. Undergraduate reporting only.</p>
      </header>
      <section className="sheet">
        <p className="directory-note">
          {unitCount} named units across {colleges.length} groups. The {latest.academic} Princeton Review file counted {integer(latest.partners)} reporting partners. This directory is the working list, not a claim that every historical partner is named yet.
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
                  {unit.note ? <p>{unit.note}</p> : <p className="quiet">Reporting unit</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </article>
  );
}
