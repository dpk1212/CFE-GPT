import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { googleConfigured } from "@/lib/googleAuth";

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  pending: "An admin has not approved this account yet. It is in Waiting for approval.",
  "google-unavailable": "Google sign-in is not available yet.",
  "google-denied": "Google sign-in was canceled.",
  "google-failed": "Google sign-in did not complete. Try again, or use a password.",
  "google-unverified": "Google did not confirm that email address.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const params = await searchParams;
  const next = params.next === "/admin" || params.next === "/judge" ? params.next : undefined;
  const notice = params.notice ? NOTICES[params.notice] : undefined;
  const google = googleConfigured();
  return (
    <article className="gate">
      <section className="panel login-panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Sign in</h1>
        <p className="quiet">Use the Google account that matches your approved judge or admin email.</p>
        {notice ? <p className="form-note" role="status">{notice}</p> : null}
        {google ? <a className="btn google-login" href="/api/auth/google">Continue with Google</a> : null}
        <LoginForm next={next} secondary={google} />
        <p className="quiet"><Link href="/request">Request judge access</Link></p>
      </section>
    </article>
  );
}
