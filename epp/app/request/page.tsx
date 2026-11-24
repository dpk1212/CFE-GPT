import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = { title: "Request access" };

export default function RequestPage() {
  return (
    <article className="gate">
      <section className="panel">
        <p className="eyebrow">Judge access</p>
        <h1>Request access</h1>
        <RequestForm />
        <p className="quiet">Already approved? <Link href="/login">Log in</Link></p>
      </section>
    </article>
  );
}
