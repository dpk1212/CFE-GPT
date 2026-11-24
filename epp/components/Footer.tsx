export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <img src="/cfe-lockup.svg" alt="Michigan Engineering, Center for Entrepreneurship, University of Michigan" />
          <p>
            © 2026 The Regents of the University of Michigan
            <br />
            Ann Arbor, MI 48109 USA
            <br />
            All Rights Reserved
            <br />
            <a href="https://www.engin.umich.edu/privacy-policies/" target="_blank" rel="noreferrer">
              Privacy Policy
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
        <div className="site-footer-contacts">
          <div>
            <h2>Visit</h2>
            <p>2281 Bonisteel Boulevard<br />3350 Duderstadt Center<br />Ann Arbor MI 48109</p>
            <p>
              <a href="https://cfe.umich.edu/launch/" target="_blank" rel="noreferrer">
                cfe.umich.edu/launch
                <span aria-hidden="true"> ↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </div>
          <div>
            <h2>Get in touch</h2>
            <p>
              <a href="https://cfe.umich.edu/contact-us/" target="_blank" rel="noreferrer">
                Contact Us
                <span aria-hidden="true"> ↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
            <p><a href="tel:+17347631021">1-734-763-1021</a></p>
          </div>
          <div>
            <h2>Center hours</h2>
            <p>Mon. – Fri.<br />9am – 5pm</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
