import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Password" };

export default async function PasswordLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next === "/admin" || params.next === "/judge" ? params.next : undefined;
  return (
    <article className="gate">
      <section className="panel login-panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Password</h1>
        <LoginForm next={next} />
        <p className="quiet"><Link href="/login">Back to sign in</Link></p>
      </section>
    </article>
  );
}
