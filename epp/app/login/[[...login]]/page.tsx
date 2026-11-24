import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { LoginForm } from "@/components/LoginForm";
import { clerkAppearance, clerkConfigured } from "@/lib/clerk";

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
  if (!clerkConfigured()) {
    return (
      <article className="gate">
        <section className="panel login-panel">
          <p className="eyebrow">Center for Entrepreneurship</p>
          <h1>Sign in</h1>
          {notice ? <p className="form-note" role="status">{notice}</p> : null}
          <LoginForm next={next} />
          <p className="quiet"><Link href="/request">Request judge access</Link></p>
        </section>
      </article>
    );
  }
  const redirectUrl = next ? `/login/continue?next=${next}` : "/login/continue";
  return (
    <article className="gate">
      <section className="panel login-panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Sign in</h1>
        <p className="quiet">Use the Google account that matches your approved judge or admin email.</p>
        {notice ? <p className="form-note" role="status">{notice}</p> : null}
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/login"
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl={redirectUrl}
          appearance={clerkAppearance}
        />
        <p className="quiet"><Link href="/login/password">Use a password instead</Link></p>
      </section>
    </article>
  );
}
