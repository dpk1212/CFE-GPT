import Link from "next/link";
import { SignOut } from "@/components/SignOut";
import type { Session } from "@/lib/session";

export function Header({ session, clerk = false }: { session: Session | null; clerk?: boolean }) {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" href="/">
          <img src="/cfe-lockup-on-blue.png" alt="Center for Entrepreneurship, University of Michigan" />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <a href="/#programs">Programs</a>
          {session?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
          {session?.role === "admin" ? <Link href="/judge">View as judge</Link> : null}
          {session?.role === "judge" ? <Link href="/judge">Fuel desk</Link> : null}
          {session ? <SignOut clerk={clerk} /> : <Link className="btn header-login" href="/login">Log in</Link>}
        </nav>
      </div>
    </header>
  );
}
