import Link from "next/link";
import { ehourLineup, impact, programs, rankings } from "@/lib/content";

export default function HomePage() {
  const upcoming = ehourLineup.filter((item) => item.upcoming);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">The Princeton Review · Entrepreneur · {rankings.year}</p>
          <h1>The Midwest’s number one school for entrepreneurship.</h1>
          <p className="lede">
            University of Michigan—Ann Arbor is No. {rankings.undergradNational} undergraduate and No. {rankings.graduateNational} graduate
            on the {rankings.year} national lists, and No. 1 in the Midwest on both. The Center for Entrepreneurship is where that
            reputation becomes a course, a cohort, or a Friday conversation.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-maize" href="/rankings">
              Read the ranking
            </Link>
            <Link className="btn btn-ghost" href="/guide">
              Ask the CFE Guide
            </Link>
          </div>
        </div>
        <div className="rank-board" aria-label="2026 Princeton Review placements">
          <article>
            <p>Midwest</p>
            <strong>No. 1</strong>
            <span>Undergraduate and graduate</span>
          </article>
          <article>
            <p>Undergraduate</p>
            <strong>No. 4</strong>
            <span>National list</span>
          </article>
          <article>
            <p>Graduate</p>
            <strong>No. 5</strong>
            <span>National list</span>
          </article>
          <p className="board-note">Announced {rankings.announced}. Top 10 nationally for more than a decade.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Why the list looks like this</p>
          <h2>A ranking is a receipt for a system students can actually enter.</h2>
        </div>
        <div className="split">
          <div className="prose">
            <p>
              The {rankings.year} lists are the twentieth annual ranking from {rankings.sourceName}. They rest on a summer 2025 survey of {rankings.surveySchools} schools and {rankings.dataPoints} measures: curriculum, faculty, experiential work, mentorship, and what alumni go on to build.
            </p>
            <p>
              In {rankings.priorYear}, Michigan’s graduate programs were No. {rankings.priorGraduate} and undergraduate programs were No. {rankings.priorUndergrad}. That was the tenth consecutive year in the national top 10. The {rankings.year} placement keeps the streak, and moves the undergraduate program from sixth to fourth.
            </p>
            <p>
              Kurt Skifstad, Dixon and Carol Doll Executive Director of the Center, has described the change directly: entrepreneurship at Michigan went from a niche academic add-on to an immersive experience for the Leaders and Best, in industry, government, academia, and startups.
            </p>
          </div>
          <blockquote className="quote">
            <p>“Entrepreneurship is the humanities of the 21st century.”</p>
            <footer>Dr. Thomas Zurbuchen, founder of the Center</footer>
          </blockquote>
        </div>
      </section>

      <section className="impact" aria-label="Center impact">
        {impact.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Six ways in</p>
          <h2>The programs behind the number.</h2>
        </div>
        <div className="program-index">
          {programs.map((program) => (
            <Link key={program.slug} href={program.href} className="program-row">
              <span className="idx">{program.index}</span>
              <span>
                <span className="row-kicker">{program.eyebrow}</span>
                <strong>{program.name}</strong>
                <span className="row-summary">{program.summary}</span>
              </span>
              <span className="row-go" aria-hidden>
                Enter
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section tight">
        <div className="two">
          <div>
            <p className="kicker">Still on the fall calendar</p>
            <h2>Dr. Thomas Zurbuchen EHour.</h2>
            <p className="lede dark">
              Fridays at 11:30 a.m. One credit as ENTR 407. The room is open to students, staff, families, and the city.
            </p>
            <Link className="text-link" href="/programs/ehour">
              Full lineup
            </Link>
          </div>
          <ol className="lineup">
            {upcoming.map((item) => (
              <li key={`${item.date}-${item.guest}`}>
                <span>{item.date}</span>
                <strong>{item.guest}</strong>
                <em>{item.role}</em>
                {"place" in item && item.place ? <small>{item.place}</small> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band">
        <div>
          <p className="kicker">NSF I-Corps · Fall 2026</p>
          <h2>Test the customer before you build the company.</h2>
          <p>
            The free virtual cohort runs October 23 through December 4, Fridays at 9:00 a.m. ET. The published registration deadline was October 16. If you missed it, the Center can tell you when the next one opens.
          </p>
          <Link className="btn btn-maize" href="/programs/i-corps">
            See the I-Corps cohort
          </Link>
        </div>
      </section>

      <section className="section guide-tease">
        <div>
          <p className="kicker">CFE Guide</p>
          <h2>A briefing desk for the published record.</h2>
          <p className="lede dark">
            Ask where Michigan ranks, whether a Ross or Medical School student can take ENTR 410, or what I-Corps actually asks you to do. Answers stay inside what the Center has published.
          </p>
          <Link className="btn btn-blue" href="/guide">
            Open the guide
          </Link>
        </div>
      </section>
    </>
  );
}
