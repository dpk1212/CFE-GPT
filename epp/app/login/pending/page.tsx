import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Waiting for approval" };

export default function PendingPage() {
  return (
    <article className="gate">
      <section className="panel login-panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Waiting for approval</h1>
        <p>An admin has not approved this account yet. You can sign in after it is approved.</p>
        <p className="quiet"><Link href="/">Back to the portal</Link></p>
      </section>
    </article>
  );
}
