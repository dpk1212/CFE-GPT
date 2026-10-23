import Link from "next/link";

export default function NotFound() {
  return (
    <article className="page">
      <header className="page-hero">
        <p className="kicker">404</p>
        <h1>That page is not on the map.</h1>
        <p className="lede dark">The program you want is probably one of the six on the index, or a question for the guide.</p>
        <div className="hero-actions">
          <Link className="btn btn-blue" href="/programs">
            Programs
          </Link>
          <Link className="btn btn-ghost dark" href="/guide">
            CFE Guide
          </Link>
        </div>
      </header>
    </article>
  );
}
