import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ehourLineup, programBySlug, programs } from "@/lib/content";

export function generateStaticParams() {
  return programs.filter((program) => program.href.startsWith("/programs/")).map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program) return { title: "Program" };
  return { title: program.name, description: program.summary };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program || !program.href.startsWith("/programs/")) notFound();

  return (
    <article className="page">
      <header className="page-hero">
        <p className="kicker">{program.eyebrow}</p>
        <h1>{program.name}</h1>
        <p className="lede dark">{program.summary}</p>
      </header>

      <dl className="fact-strip">
        <div>
          <dt>Who it is for</dt>
          <dd>{program.forWhom}</dd>
        </div>
        <div>
          <dt>The commitment</dt>
          <dd>{program.commitment}</dd>
        </div>
      </dl>

      <div className="page-grid">
        <div className="points">
          {program.points.map((point) => (
            <section key={point.title}>
              <h2>{point.title}</h2>
              <p>{point.body}</p>
            </section>
          ))}
          {slug === "ehour" && (
            <section>
              <h2>Fall 2026 lineup</h2>
              <ol className="lineup full">
                {ehourLineup.map((item) => (
                  <li key={`${item.date}-${item.guest}`} className={item.upcoming ? "is-next" : undefined}>
                    <span>{item.date}</span>
                    <strong>{item.guest}</strong>
                    <em>{item.role}</em>
                    {item.upcoming ? <small>{"place" in item && item.place ? item.place : "Upcoming"}</small> : <small>Held</small>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {slug === "i-corps" && (
            <section className="callout">
              <h2>If the October 16 deadline has passed</h2>
              <p>
                The fall cohort itself begins October 23, 2026. The date the Center published for registration was October 16. Treat that deadline as closed unless an advisor tells you otherwise, and ask when the next virtual cohort is scheduled.
              </p>
            </section>
          )}
        </div>
        <aside className="aside">
          <p className="kicker">At a glance</p>
          {program.facts.map((fact) => (
            <p key={fact.label}>
              <strong>{fact.label}</strong>
              {fact.value}
            </p>
          ))}
          <a href={program.official}>Official Center page</a>
          <Link href="/guide">Ask the guide about this</Link>
          <Link href="/visit">Talk with an advisor</Link>
        </aside>
      </div>
    </article>
  );
}
