import Link from "next/link";

const programs = [
  {
    tone: "tone-blue",
    kicker: "Leadership",
    title: "Entrepreneurial Leadership Program",
    href: "https://cfe.umich.edu/launch/entrepreneurial-leadership-program/",
    link: "Visit the ELP page",
    text: "ELP blends hands-on learning with coaching. It is a path into a changemaker mindset and the leadership skills to build a venture during or after college.",
    points: [
      "Open to undergraduate and graduate students from every school and college.",
      "A one-year commitment: ENTR 470, a 3-credit course in the winter, then ENTR 480 in the fall.",
      "Coaching Connection pairs each student with an entrepreneur, investor, or leader.",
      "Summer practice comes through a startup internship, shadowing, or a student’s own venture.",
    ],
  },
  {
    tone: "tone-maize",
    kicker: "Technology",
    title: "Perot Jain TechLab Series",
    href: "https://cfe.umich.edu/launch/perot-jain-techlab-series/",
    link: "Visit the Perot Jain TechLab page",
    text: "TechLab puts student teams on real technical work with startups. The series is preparation for students who want to be at the front of a new technology.",
    points: [
      "Open to undergraduate and graduate students. Teams are chosen through an application.",
      "A full year: a 3-credit course in the winter and another in the fall.",
      "Each team meets weekly with a technical coach from the partner company.",
      "Projects have included transportation at Mcity, electrification, climate, and health technology.",
    ],
  },
  {
    tone: "tone-paper",
    kicker: "Campus",
    title: "Student Endeavors",
    href: "https://cfe.umich.edu/launch/erp-student-sources/",
    link: "Visit Student Endeavors",
    text: "Endeavors is where a student idea gets room to move. The Center makes space for special programs, competitions, and events beyond the year-long cohorts.",
    points: [
      "Creativity is encouraged, and the obstacles in the way of a student project are taken seriously.",
      "Competitions and short programs sit alongside ELP and TechLab.",
      "Students stay connected to the Center after the event or the term ends.",
    ],
  },
];

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a className="text-cta" href={href} target="_blank" rel="noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="page-header">
        <svg className="page-lines" viewBox="0 0 640 480" aria-hidden="true">
          <line x1="120" y1="500" x2="420" y2="-20" />
          <line x1="210" y1="500" x2="510" y2="-20" />
          <line x1="300" y1="500" x2="600" y2="-20" />
          <line x1="390" y1="500" x2="690" y2="-20" />
        </svg>
        <div className="container page-header-copy">
          <p className="crumb">Launch / Entrepreneurial Practice Programs</p>
          <h1>Entrepreneurial Practice Programs</h1>
        </div>
      </section>
      <section className="intro">
        <div className="container intro-inner">
          <h2>We are immersive.</h2>
          <p>
            The Entrepreneurial Leadership Program and Perot Jain TechLab Series offer tailored training and coaching for aspiring leaders. Step beyond the classroom into practical, managerial, and leadership work with startups, guided by mentors across fields. The relationships last past graduation.
          </p>
          <div className="intro-actions">
            <Link className="text-cta" href="/request">Request judge access</Link>
            <Link className="btn" href="/login">Log in</Link>
          </div>
        </div>
      </section>
      <section className="band" id="programs">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">The practice</p>
            <h2>Three ways in</h2>
          </div>
          <div className="program-row">
            {programs.map((program) => (
              <article key={program.title} className={program.tone}>
                <p className="card-kicker">{program.kicker}</p>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <ul>
                  {program.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <ExternalLink href={program.href}>{program.link}</ExternalLink>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="facts" aria-label="Program facts">
        <div className="container facts-row">
          <article><strong>Every school</strong><span>Undergraduate and graduate students may apply.</span></article>
          <article><strong>One year</strong><span>Winter and fall courses, three credits each term.</span></article>
          <article><strong>By selection</strong><span>A formal application decides the cohort.</span></article>
        </div>
      </section>
      <section className="quote">
        <figure className="container">
          <blockquote>
            <p>I truly can’t recommend making the CFE a part of your academic experience enough. It has forever altered my future as a student, as a hopeful business founder, and as a person.</p>
          </blockquote>
          <figcaption>Christian Leonard, Master’s in Robotics, ELP fellow</figcaption>
        </figure>
      </section>
    </>
  );
}
