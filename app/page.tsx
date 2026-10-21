import Link from "next/link";
import { integer, latest, money, percent } from "@/lib/history";

export default function HomePage() {
  return (
    <>
      <section className="hero-brand">
        <div className="hero-copy">
          <span className="tick" aria-hidden />
          <p className="hero-kicker">University of Michigan</p>
          <h1>Learn. Launch. Lead.</h1>
          <p className="hero-line">Look to Michigan for entrepreneurship</p>
        </div>
        <svg className="stripes" viewBox="0 0 640 420" aria-hidden>
          <line x1="90" y1="400" x2="280" y2="10" stroke="#FFCB05" strokeWidth="3" />
          <line x1="190" y1="420" x2="380" y2="20" stroke="#F15A24" strokeWidth="3" />
          <line x1="280" y1="400" x2="460" y2="50" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <line x1="370" y1="420" x2="560" y2="20" stroke="#FFCB05" strokeWidth="3" />
        </svg>
      </section>
      <section className="home-intro">
        <h2>We are the CFE</h2>
        <p>
          The Center for Entrepreneurship is open to every school and college, from the first undergraduate course through the PhD. Since 2008, the work has been courses, practice, and a path into the venture.
        </p>
        <div className="proof">
          <Link href="/historical-data">
            <strong>{integer(latest.enrollment)}</strong>
            <span>Students in {latest.academic}</span>
          </Link>
          <Link href="/historical-data">
            <strong>{percent(latest.ugShare)}</strong>
            <span>Of the undergraduate body</span>
          </Link>
          <Link href="/partners">
            <strong>{integer(latest.partners)}</strong>
            <span>Reporting partners</span>
          </Link>
          <Link href="/historical-data">
            <strong>{money(latest.scholarshipDollarsCumulative)}</strong>
            <span>Cumulative student awards</span>
          </Link>
        </div>
      </section>
    </>
  );
}
