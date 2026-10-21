import Link from "next/link";
import { center } from "@/lib/content";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <p className="kicker">University of Michigan</p>
          <p className="footer-title">Center for Entrepreneurship</p>
          <p>
            {center.address}
            <br />
            {center.city}
          </p>
          <p>
            <a href={center.phoneHref}>{center.phone}</a>
            <br />
            <a href={`mailto:${center.email}`}>{center.email}</a>
          </p>
          <p>{center.hours}</p>
        </div>
        <div>
          <p className="kicker">On this site</p>
          <ul>
            <li><Link href="/rankings">2026 Princeton Review</Link></li>
            <li><Link href="/programs">Programs</Link></li>
            <li><Link href="/courses">ENTR courses</Link></li>
            <li><Link href="/programs/i-corps">NSF I-Corps</Link></li>
            <li><Link href="/guide">CFE Guide</Link></li>
            <li><Link href="/visit">Visit and advise</Link></li>
          </ul>
        </div>
        <div>
          <p className="kicker">Official channels</p>
          <ul>
            <li><a href={center.official}>cfe.umich.edu</a></li>
            <li><a href={center.ecosystem}>entrepreneurship.umich.edu</a></li>
            <li><a href="https://cfe.umich.edu/ehour/">EHour schedule</a></li>
            <li><a href="https://wolverineaccess.umich.edu">Wolverine Access</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-note">
        <p>
          Program facts on this site are drawn from the Center’s public pages and the November 12, 2025 Princeton Review and Entrepreneur announcement. Confirm registration, rooms, and deadlines on cfe.umich.edu before you act on them.
        </p>
        <p>Learn. Launch. Lead.</p>
      </div>
    </footer>
  );
}
