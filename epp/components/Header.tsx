import Link from "next/link";
import { SignOut } from "@/components/SignOut";
import type { Session } from "@/lib/session";

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" fill="#00274C" />
            <path fill="#FFCB05" transform="translate(1.6 5.17) scale(0.619)" d="M23.2689 28.6539l-9.5265-13.3962v9.7122h3.7933v9.594h-17.5357v-9.594h3.55324v-14.9426h-3.55324v-9.593962h13.7712l9.4977 13.445362 9.5073-13.455212h13.7616v9.594012h-3.5533v14.9524h3.5533v9.594h-17.5261v-9.594h3.7933v-9.7122z" />
          </svg>
          <span>
            <strong>Center for Entrepreneurship</strong>
            <em>Entrepreneurial Practice Programs</em>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <a href="/#programs">Programs</a>
          {session?.role === "admin" ? <Link href="/admin">Approvals</Link> : null}
          {session?.role === "judge" ? <Link href="/judge">Home</Link> : null}
          {session ? <SignOut /> : <Link href="/login">Log in</Link>}
        </nav>
      </div>
    </header>
  );
}
