export default function HomePage() {
  return (
    <>
      <section className="hero-brand">
        <div className="hero-copy">
          <span className="tick" aria-hidden />
          <h1>Learn. Launch. Lead.</h1>
          <p>Look to Michigan for entrepreneurship</p>
        </div>
        <svg className="stripes" viewBox="0 0 520 360" aria-hidden>
          <line x1="80" y1="340" x2="250" y2="20" stroke="#FFCB05" strokeWidth="4" />
          <line x1="170" y1="360" x2="340" y2="30" stroke="#F15A24" strokeWidth="4" />
          <line x1="250" y1="340" x2="400" y2="70" stroke="#ffffff" strokeWidth="3" />
          <line x1="330" y1="360" x2="490" y2="40" stroke="#FFCB05" strokeWidth="4" />
        </svg>
      </section>
      <section className="home-intro">
        <h2>We are the CFE</h2>
        <p>
          The Center for Entrepreneurship is open to every school and college, from the first undergraduate course through the PhD. Since 2008, the work has been the same: courses, practice, and a path into the venture.
        </p>
      </section>
    </>
  );
}
