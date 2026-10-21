import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to the Center for Entrepreneurship.",
};

export default function LoginPage() {
  return (
    <article className="login-wrap">
      <section className="login-card">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>Log in</h1>
        <p className="quiet">Staff and reporting partners.</p>
        <LoginForm />
      </section>
    </article>
  );
}
