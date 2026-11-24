import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next === "/admin" || params.next === "/judge" ? params.next : undefined;
  return (
    <article className="gate">
      <section className="panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Log in</h1>
        <p className="quiet">Judges and admins use the account an admin has approved. Choose the role that matches the account.</p>
        <LoginForm next={next} />
        <p className="quiet"><Link href="/request">Request judge access</Link></p>
      </section>
    </article>
  );
}
