import Link from "next/link";

const programs = [
  {
    title: "Entrepreneurial Leadership Program",
    href: "https://cfe.umich.edu/launch/entrepreneurial-leadership-program/",
    link: "Visit the Entrepreneurial Leadership Program page",
    photo: "/photos/elp.webp",
    alt: "Entrepreneurial Leadership Program students in ELP fleece talking beside a whiteboard",
    text: "The ELP curriculum is intense and hands-on, giving students the tools to launch their own businesses during or after college. University of Michigan students from all colleges and schools may apply. Participation requires a formal application and selection process, and the program is a one-year commitment: ENTR 470 in the winter, then ENTR 480 in the fall.",
  },
  {
    title: "Perot Jain TechLab Series",
    href: "https://cfe.umich.edu/launch/perot-jain-techlab-series/",
    link: "Visit the Perot Jain TechLab Series page",
    photo: "/photos/techlab-mcity.webp",
    alt: "Perot Jain TechLab students with a Mcity vehicle, one adjusting roof sensors while another sits in the driver's seat",
    text: "The Perot Jain TechLab Series offers ambitious students unparalleled training, mentoring, and hands-on experience in cutting-edge fields like autonomous vehicles, climate change, healthcare, transportation electrification, and air and space. The courses are a year-long commitment, from winter to fall, and earn a total of 6 academic credits.",
  },
  {
    title: "Partner with Perot Jain TechLab",
    href: "https://cfe.umich.edu/launch/partner-with-the-perot-jain-techlab-series/",
    link: "Visit the partner page for Perot Jain TechLab",
    photo: "/photos/techlab-partners.jpg",
    alt: "Center for Entrepreneurship students and staff holding a banner in a campus atrium",
    text: "The University of Michigan Center for Entrepreneurship is seeking startups for the Perot Jain TechLab Series, an opportunity to work with STEM students on real-world technical and entrepreneurial challenges over an academic year. There is no financial cost for companies.",
  },
  {
    group: "Fuel",
    title: "Fuel",
    href: "https://cfe.umich.edu/launch/fuel/",
    link: "Visit the Fuel page",
    text: "Fuel is a University of Michigan funding program providing monthly, non-competitive awards of up to $25,000 to help student teams reach milestones and move their ventures forward. The academic year has six application cycles, with deadlines in September, October, November, January, March, and April. Advancing teams pitch in person, and judges may award any amount from $0 up to the request.",
  },
  {
    group: "Fuel",
    title: "Fuel Consumer IT",
    href: "https://cfe.umich.edu/launch/fuel-faculty/",
    link: "Visit the Fuel Consumer IT page",
    text: "Fuel Consumer IT is for a U-M Ann Arbor faculty or staff member building a consumer IT startup. Applications are accepted on a rolling basis and evaluated by a panel of five judges. Non-dilutive grants range from $5,000 to $100,000. Students with ventures use the primary Fuel program.",
  },
  {
    group: "Fuel",
    title: "Fuel Jumpstart",
    href: "https://cfe.umich.edu/launch/fuel-jumpstart/",
    link: "Visit the Fuel Jumpstart page",
    text: "Fuel Jumpstart gives U-M student founders a $500 non-dilutive microgrant and light advising for an early-stage idea. Forty awards are available each academic year. Applicants are Ann Arbor undergraduate or graduate students more than six months from graduation. Judges are CFE staff and the Fuel administrators.",
  },
  {
    title: "Student Endeavors",
    href: "https://cfe.umich.edu/launch/erp-student-sources/",
    link: "Visit the Student Endeavors page",
    photo: "/photos/student-endeavors.webp",
    alt: "Students in a workshop gathered around a wheeled robot with a camera and exposed wiring",
    text: "The CFE is a place where creativity thrives, barriers are removed, and ideas become action. Student Endeavors includes Trends in Tech Talk, student treks, Women in Entrepreneurship, and MPowered.",
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
        <img
          className="page-header-photo"
          src="/photos/students-walking.webp"
          alt="Students crossing a downtown street, several wearing University of Michigan and Entrepreneurial Leadership Program shirts"
          width={1800}
          height={850}
        />
        <div className="page-header-shade" aria-hidden="true" />
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
      <section className="intro" id="portal">
        <div className="container intro-inner">
          <p className="eyebrow">Portal</p>
          <h2>Sign in or request access</h2>
          <p>
            This site is the front door for the Entrepreneurial Practice Programs. Admins and judges sign in with an approved account. A new judge requests access here, and an admin approves it before the account can be used. Approved judges open the Fuel desk to review Fuel applications.
          </p>
          <div className="intro-actions">
            <Link className="btn" href="/login">Sign in</Link>
            <Link className="text-cta" href="/request">Request access</Link>
            <Link className="text-cta" href="/judge">Fuel desk</Link>
          </div>
        </div>
      </section>
      <section className="band" id="programs">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Launch</p>
            <h2>The programs</h2>
          </div>
          <p className="directory-lead">The Launch menu lists these programs. Each link opens the official Center for Entrepreneurship page.</p>
          <ul className="directory">
            {programs.map((program, index) => {
              const showGroup = program.group && program.group !== programs[index - 1]?.group;
              return (
                <li key={program.title} className={program.photo ? "directory-item" : "directory-item is-text"}>
                  {showGroup ? (
                    <p className="directory-group">Fuel, Fuel Consumer IT, and Fuel Jumpstart are separate funding programs. Who may apply, and the size of the award, are different on each page.</p>
                  ) : null}
                  {program.photo ? <img className="directory-photo" src={program.photo} alt={program.alt} /> : null}
                  <div className="directory-copy">
                    <h3>{program.title}</h3>
                    <p>{program.text}</p>
                    <ExternalLink href={program.href}>{program.link}</ExternalLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
